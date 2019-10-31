/** 
 * @name socket-server.js 
 * @fileOverview Handles socket.io related functionalities 
 * @author Aruna Attanayake 
 */ 
 
(function() { 
 
    'use strict'; 
 
    let app = require('express')(); 
    let io = require('socket.io')(); 
    let _ = require('lodash'); 
    var isEmpty = require('is-empty'); 
    var async = require('async'); 
    let User = require('../models/user'); 
    let Chat = require('../models/chat'); 
    let Shop = require('../models/shop'); 
    let BookingRequest = require('../models/booking-request'); 
    let responseMessages = require('../lib/response-messages'); 
    let Logger = require('./logger').Logger; 
 
    // Hold connected user details 
    let clients = []; 
     
    // Initialize logger 
    let log = new Logger(); 
    log.logData.logType = log.API; 
    log.logData.action = 'socketServer'; 
 
    io.use(function(socket, next) { 
        log.writeLog('Connection request received. query: ' + JSON.stringify(socket.request._query)); 
        let jwtAccessToken = socket.request._query['accessToken']; 
        if (jwtAccessToken) { 
            let jwtData = User.validateJwt(jwtAccessToken); 
            if (jwtData) { 
                socket.request.user = jwtData; 
                next(); 
            } else { 
                log.writeLog('Invalid access token'); 
                next(new Error(responseMessages.AUTH_FAILED)); 
            } 
        } else { 
            log.writeLog('Access token not provided'); 
            next(new Error(responseMessages.AUTH_FAILED)); 
        } 
    }); 
 
    io.on('connection', function(socket) { 
        clients.push({socketId: socket.id, userId: socket.request.user.userId}); 
        log.writeLog('Connected. SocketId:' + socket.id + ', UserId:' + socket.request.user.userId + ', Client count: ' + clients.length); 
         
        sendOfflineChatNotifications(socket.request.user.userId); 
        sendOfflineAppointmentNotifications(socket.request.user.userId); 
 
        socket.on('disconnect', function() { 
            handleDisconnect(socket); 
        }); 
 
        socket.on('typing', function(data) { 
            log.writeLog('Received typing event.'); 
            try { 
                sendMessage('typing', data.receiverId, data, function(status) {}); 
            } catch (err) { 
                log.writeLog('Invalid data'); 
            } 
        }); 
    }); 
 
    /** 
     * Handle disconnect. Remove disconnected client from clients array 
     * @param {object} socket Socket object 
     */ 
    function handleDisconnect(socket) { 
        let socketId = socket.id; 
 
        _.remove(clients, function (client) { 
            return client.socketId == socket.id; 
        }); 
 
        log.writeLog('Disconnected. SocketId:' + socketId + ', Client count:' + clients.length); 
    } 
 
    /** 
     * Notify offline chat notification messages as soon as user connected 
     * @param {string} userId User id of the connected user 
     */ 
    function sendOfflineChatNotifications(userId) { 
        log.writeLog('Sending offline chats to user. UserId:' + userId); 
        Chat.getAll({receiverId: userId, isNotified: Chat.IS_NOTIFIED_NO}, 1, 10, { createdAt: -1 }, function (err, chatMessages) { 
            if (!err) { 
                if (chatMessages.length > 0) { 
                    for (var i = 0; i < chatMessages.length; i++) { 
                        var chatMessage = responseMessages.chatMessage(chatMessages[i]); 
                        sendChatNotification(userId, chatMessage, function(status) { 
                            if (status == 'success') { 
                                Chat.updateById({ _id: chatMessage.id }, {isNotified: Chat.IS_NOTIFIED_YES}, function (err, result) { 
                                    if (!err) { 
                                        log.writeLog('Notified status updated.'); 
                                    } else { 
                                        log.writeLog('Notified status update failed.'); 
                                    } 
                                }); 
                                log.writeLog('Offline chat notification sent.'); 
                            } else { 
                                log.writeLog('Offline chat notification sending failed.'); 
                            } 
                        }); 
                    } 
                } else { 
                    log.writeLog('No offline messages to be sent.'); 
                } 
            } else { 
                log.writeLog('Error while sending offline chats to user.', JSON.stringify(err)); 
            } 
        }); 
    } 
 
    /** 
     * Notify offline appointment notification messages as soon as user connected 
     * @param {string} userId User id (Shop owner id) of the connected user. 
     */ 
    function sendOfflineAppointmentNotifications(userId) { 
        log.writeLog('Sending offline appointments to user. UserId:' + userId); 
 
        async.waterfall([ 
            function (callback) { 
                Shop.getIdsByShopOwner(userId, function (err, shopIds) { 
                    if (!isEmpty(shopIds)) { 
                        callback(null, shopIds); 
                    } else { 
                        log.writeLog('No shops own by the user'); 
                        return false; 
                    } 
                }); 
            }, 
            function (shopIds, callback) { 
                let ids = []; 
                for (let i = 0; i < shopIds.length; i++) { 
                    ids.push(shopIds[i]._id); 
                } 
                BookingRequest.getAll({shopId: { $in: ids}, isNotified: Chat.IS_NOTIFIED_NO}, 1, 100, { createdAt: -1 }, function (err, bookingRequests) { 
                    callback(err, bookingRequests); 
                }); 
            } 
        ], function (err, bookingRequests) { 
            if (err) { 
                log.writeLog('Error while sending offline appointment notifications.'); 
            } else { 
                if (!isEmpty(bookingRequests)) { 
                    for (var i=0; i<bookingRequests.length; i++) { 
                        let booking = responseMessages.bookingRequest(bookingRequests[i]); 
                        sendAppointmentNotification(userId, booking, function(status) { 
                            if (status == 'success') { 
                                BookingRequest.updateById({ _id: booking.id }, { isNotified: BookingRequest.IS_NOTIFIED_YES }, function (err, result) { 
                                    if (!err) { 
                                        log.writeLog('Notified status updated.'); 
                                    } else { 
                                        log.writeLog('Notified status update failed.'); 
                                    } 
                                }); 
                                log.writeLog('Offline appointment notification sent.'); 
                            } else { 
                                log.writeLog('Offline appointment notification sending failed.'); 
                            } 
                        }); 
                    } 
                } else { 
                    log.writeLog('No offline appointments to be sent.'); 
                } 
            } 
        }); 
    } 
 
    /** 
     * Send message to specific user 
     * @param {string} clientListnerName Listner name of the client app 
     * @param {string} receiverId User id of the message receiver 
     * @param {object} data Data to be sent to user 
     */ 
    function sendMessage(clientListnerName, receiverId, data, callback) { 
        let receivers = _.filter(clients, { 'userId': receiverId }); 
        log.writeLog('Send message', JSON.stringify({'listnerName': clientListnerName, 'receivers:': receivers, 'data': data})); 
 
        if (receivers.length > 0) { 
            _.forEach (receivers, function(receiver) { 
                let receiverSocketId = receiver.socketId; 
                io.sockets.connected[receiverSocketId].emit(clientListnerName, data); 
            }); 
            log.writeLog('Message sent.'); 
            callback('success'); 
        } else { 
            log.writeLog('User is not online cannot send the message right now.'); 
            callback('failed'); 
        } 
    } 
 
    /** 
     * Send chat notification 
     * @param {string} receiverId User id of the message receiver 
     * @param {object} data Data to be sent to user 
     * @callback request callback 
     */ 
    function sendChatNotification(receiverId, data, callback) { 
        sendMessage('shopChatNotification', receiverId, data, callback); 
    } 
 
    /** 
     * Send appointment notification to shop manager 
     * @param {string} receiverId User id of the message receiver 
     * @param {object} data Data to be sent to user 
     * @callback request callback 
     */ 
    function sendAppointmentNotification(receiverId, data, callback) { 
        sendMessage('appointmentNotification', receiverId, data, callback); 
    } 
 
    /** 
     * Export module functions to be accessed from outside 
     */ 
    module.exports = { 
        sendChatNotification: sendChatNotification, 
        sendAppointmentNotification: sendAppointmentNotification, 
        io: io 
    } 
})(); 
 

