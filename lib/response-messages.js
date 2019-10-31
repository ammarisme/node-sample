
/** 
 * @name response-messages.js 
 * @fileOverview Prepare response JSON messages 
 * @author Aruna Attanayake 
 */ 
 
(function() { 
 
  'use strict'; 
 
    var _ = require('lodash'); 
    var util = require('../lib/util'); 
    var isEmpty = require('is-empty'); 
    var config = require('config'); 
    var autolinker = require('autolinker'); 
    var bucketName = config.get('aws.bucketName'); 
    var defaultLogo = config.get('aws.shop-default-logo'); 
    var defaultBanner = config.get('aws.shop-default-banner'); 
 
    /** 
     * Prepare common response JSON 
     * @param {string} code - Error code 
     * @param {string} attribute - Attribute name. This should available only for validation errors 
     * @param {object} data - Any other date to be sent. Ex:view record data 
     * @param {string} message - Optional message to be sent 
     * @returns {object} 
     */ 
    function commonResponse(code, attribute = '', data = '', message = '') { 
        var msg = { 
            'code': code, 
            'attribute': attribute, 
            'data': data, 
            'message': message 
        } 
 
        return msg; 
    } 
 
    /** 
     * Format created object responsee 
     * @param {object} createdObject - Id of the created object 
     * @param {string} attribute - Attribute name. This should available only for validation errors 
     * @returns {object} 
     */ 
    function formatCreatedObject(createdObject) { 
        var msg = { 
            'id': createdObject._id 
        } 
 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON objecut for permission 
     * @param {object} permission - JSON object 
     * @returns {object} 
     */ 
    function permission(permission) { 
        var msg = removeAttributes(permission, ['_id', '__v', 'createdById', 'updatedById']); 
        msg = formatAttributes(msg, permission); 
        msg.id = permission._id; 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for user 
     * @param {object} user - JSON object 
     * @returns {object} 
     */ 
    function user(user) { 
        var msg = removeAttributes(user, ['_id', '__v', 'password', 'createdById', 'updatedById', 'verificationCode', 
            'resetPasswordExpires', 'resetPasswordToken', 'roleId', 'origPassword']); 
        msg = formatAttributes(msg, user); 
        if (user.createdById && user.createdById._id) { 
            msg.createdBy.id = user.createdById._id; 
        } 
        if (user.updatedById && user.updatedById._id) { 
            msg.updatedBy.id = user.updatedById._id; 
        } 
        msg.id = user._id; 
 
        var roleString = _.replace(JSON.stringify(user.roleId), new RegExp("_id", "g"), 'id'); 
        msg.role = JSON.parse(roleString); 
 
        // email and sysEmail are sparse indexes and not available in some records. 
        // to keep the consistancy manually add them to the response 
        msg.sysEmail = user.sysEmail ? user.sysEmail : null; 
        msg.email = user.email ? user.email : null; 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for Vehicle 
     * @param {object} vehicle - JSON object 
     * @returns {object} 
     */ 
    function vehicle(vehicle) { 
        var msg = JSON.parse(JSON.stringify(vehicle)); 
        msg.id = vehicle._id; 
        delete msg._id; 
        delete msg.__v; 
        delete msg.custEmail; 
        msg.createdAt = vehicle.createdAt ? util.formatDate(vehicle.createdAt) : null; 
        msg.updatedAt = vehicle.updatedAt ? util.formatDate(vehicle.updatedAt) : null; 
        msg.mfgDate = vehicle.mfgDate ? util.formatDate(vehicle.mfgDate, 'YYYY-MM-DD') : null; 
        msg.lastInDate = vehicle.lastInDate ? util.formatDate(vehicle.lastInDate, 'YYYY-MM-DD') : null; 
        msg.inspDate = vehicle.inspDate ? util.formatDate(vehicle.inspDate, 'YYYY-MM-DD') : null; 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for VehicleRepairHistory 
     * @param {object} vehicleRepairHistory - JSON object 
     * @returns {object} 
     */ 
    function vehicleRepairHistory(vehicleRepairHistory) { 
        var msg = removeAttributes(vehicleRepairHistory, ['_id', '__v', 'userId']); 
        msg.createdAt = vehicleRepairHistory.createdAt ? util.formatDate(vehicleRepairHistory.createdAt) : null; 
        msg.updatedAt = vehicleRepairHistory.updatedAt ? util.formatDate(vehicleRepairHistory.updatedAt) : null; 
        msg.dateOfService = vehicleRepairHistory.dateOfService ? util.formatDate(vehicleRepairHistory.dateOfService, 'YYYY-MM-DD') : null; 
        msg.id = vehicleRepairHistory._id; 
        if (vehicleRepairHistory.userId) { 
            msg.user = { 
                id: vehicleRepairHistory.userId._id, 
                firstName: vehicleRepairHistory.userId.firstName, 
                lastName: vehicleRepairHistory.userId.lastName 
            } 
        } else { 
            msg.user = null; 
        } 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for VehicleRecommendation 
     * @param {object} vehicleRecommendation - JSON object 
     * @returns {object} 
     */ 
    function vehicleRecommendation(vehicleRecommendation) { 
        var msg = removeAttributes(vehicleRecommendation, ['_id', '__v', 'userId']); 
        msg.createdAt = vehicleRecommendation.createdAt ? util.formatDate(vehicleRecommendation.createdAt) : null; 
        msg.updatedAt = vehicleRecommendation.updatedAt ? util.formatDate(vehicleRecommendation.updatedAt) : null; 
        msg.recommendDate = vehicleRecommendation.recommendDate ? util.formatDate(vehicleRecommendation.recommendDate, 'YYYY-MM-DD') : null; 
        msg.id = vehicleRecommendation._id; 
        if (vehicleRecommendation.userId) { 
            msg.user = { 
                id: vehicleRecommendation.userId._id, 
                firstName: vehicleRecommendation.userId.firstName, 
                lastName: vehicleRecommendation.userId.lastName 
            } 
        } else { 
            msg.user = null; 
        } 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for autocomplete user 
     * @param {object} user - Partial User JSON object 
     * @returns {object} 
     */ 
    function autocompleteUser(user) { 
        let email = isEmpty(user.email) ? user.sysEmail : user.email; 
        let msg = { 
            fullName: user.fullName, 
            email: email, 
            id: user._id 
        } 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for CarOwnerSubscription 
     * @param {object} subscription - JSON object 
     * @returns {object} 
     */ 
    function subscription(subscription) { 
        var msg = removeAttributes(subscription, ['_id', '__v', 'createdById', 'updatedById']); 
        msg = formatAttributes(msg, subscription); 
        msg = formatCarOwnerAttributes(msg, subscription); 
        msg.id = subscription._id; 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for BookingRequest 
     * @param {object} bookingRequest - JSON object 
     * @returns {object} 
     */ 
    function bookingRequest(bookingRequest) { 
        var msg = removeAttributes(bookingRequest, ['_id', '__v', 'createdById', 'updatedById', 'userId', 'bookingDateTime', 'vehicleId']); 
        msg = formatAttributes(msg, bookingRequest); 
        msg.bookingDateTime = bookingRequest.bookingDateTime ? util.formatDate(bookingRequest.bookingDateTime) : null; 
        msg.id = bookingRequest._id; 
 
        if (bookingRequest.userId) { 
            msg.user = { 
                id: bookingRequest.userId._id, 
                firstName: bookingRequest.userId.firstName, 
                lastName: bookingRequest.userId.lastName, 
                timezone: bookingRequest.userId.timezone  || "America/Chicago" 
            } 
        } else { 
            msg.user = null; 
        } 
 
        if (bookingRequest.vehicleId) { 
            msg.vehicle = { 
                id: bookingRequest.vehicleId._id, 
                model: bookingRequest.vehicleId.model, 
                licenseNumber: bookingRequest.vehicleId.licenseNumber, 
                make: bookingRequest.vehicleId.make, 
                year: bookingRequest.vehicleId.year 
            }; 
        } else { 
            msg.vehicle = null; 
        } 
 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for user when authentication. Just include permissions 
     * @param {object} user - JSON object 
     * @returns {object} 
     */ 
    function userAuth(user) { 
        var msg = removeAttributes(user, ['_id', '__v', 'password', 'createdById', 'updatedById', 'roleId', 
            'verificationCode', 'resetPasswordExpires', 'resetPasswordToken', 'origPassword']); 
        msg = formatAttributes(msg, user); 
        msg.id = user._id; 
        msg.roleId = !isEmpty(user.roleId) ? user.roleId._id : null; 
 
        var roleString = _.replace(JSON.stringify(user.roleId), new RegExp("_id", "g"), 'id'); 
        msg.role = JSON.parse(roleString); 
 
        // email and sysEmail are sparse indexes and not available in some records. 
        // to keep the consistancy manually add them to the response 
        msg.sysEmail = user.sysEmail ? user.sysEmail : null; 
        msg.email = user.email ? user.email : null; 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for role 
     * @param {object} role - JSON object 
     * @returns {object} 
     */ 
    function role(role) { 
        var msg = removeAttributes(role, ['_id', '__v', 'password', 'createdById', 'updatedById']); 
        msg = formatAttributes(msg, role); 
        msg.id = role._id; 
 
        var permissionsString = _.replace(JSON.stringify(msg.permissions), new RegExp("_id", "g"), 'id'); 
        msg.permissions = JSON.parse(permissionsString); 
 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for shop 
     * @param {object} shop - JSON object 
     * @param {integer} subscriptionStatus - User subscription status of the shop 
     * @param {ObjectId} subscriptionId - Subscription ID 
     * @returns {object} 
     */ 
    function shop(shop, subscriptionStatus = null, subscriptionId = null) { 
        var msg = shop; 
        msg = populateURL(msg, shop); 
        msg = removeAttributes(shop, ['_id', '__v', 'createdById', 'updatedById', 'logoName', 'bannerName']); 
        msg = formatAttributes(msg, shop); 
        msg = populateURL(msg, shop); 
        msg.id = shop._id; 
        msg.subscriptionStatus = subscriptionStatus; 
        msg.subscriptionId = subscriptionId; 
        var shopOwnerString = _.replace(JSON.stringify(msg.shopOwner), new RegExp("_id", "g"), 'id'); 
        msg.shopOwner = JSON.parse(shopOwnerString); 
        if (!shop.businessDays) { 
            shop.businessDays = config.get('shop.defaultBusinessDays'); 
        } 
        if (!shop.businessHours) { 
            shop.businessHours = {}; 
            shop.businessHours.openTime = config.get('shop.defaultOpenTime'); 
            shop.businessHours.closeTime = config.get('shop.defaultCloseTime'); 
        } 
        msg.businessHours = {}; 
        msg.businessHours.openTime = formatTime(shop.businessHours.openTime); 
        msg.businessHours.closeTime = formatTime(shop.businessHours.closeTime); 
        if (isEmpty(shop.rewardStatus)) { 
            msg.rewardStatus = 0; 
        } 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for subscribed shop 
     * @param {object} shop - JSON object 
     * @returns {object} 
     */ 
    function subscribedShop(shop, subscriptionStatus) { 
        var msg = shop; 
        msg = populateURL(msg, shop); 
        msg = removeAttributes(shop, ['_id', '__v', 'createdById', 'updatedById', 'logoName', 'bannerName', 
            'updatedAt', 'createdAt', 'shopOwner', 'carOwners']); 
        msg = formatAttributes(msg, shop); 
        msg = _.omit(msg, ['createdBy', 'updatedBy', 'createdAt', 'updatedAt']); 
        msg = populateURL(msg, shop); 
        msg.id = shop._id; 
        msg.subscriptionStatus = subscriptionStatus; 
        return msg; 
    } 
 
    /** 
     * Prepare S3 response JSON 
     * @param {String} filaName - S3 file name 
     * @param {String} location - File Presigned URL 
     * @returns {object} 
     */ 
    function s3Response(fileName = '', location ='') { 
        var msg = { 
            'code': this.SUCCESS, 
            'data': { "fileName": fileName, "location": location } 
        } 
        return msg; 
    } 
 
    /** 
     * Remove attributes those not be sent with response. ex:_id, __v 
     * @param {object} object - JSON object 
     * @param {array} attributes - Attributes to be removed 
     * @returns {object} 
     */ 
    function removeAttributes(object, attributes) { 
 
        var objectRes = {}; 
        for (var key in object.toJSON()) { 
            if (attributes.indexOf(key) == -1) { 
                objectRes[key] = object[key]; 
            } 
        } 
 
        return objectRes; 
    } 
 
    /** 
     * Format common attributes to be sent on response 
     * @param {object} msg - Formatted msg object 
     * @param {object} origMsg - Original message 
     * @returns {object} 
     */ 
    function formatAttributes(msg, origMsg) { 
        msg.createdAt = origMsg.createdAt ? util.formatDate(origMsg.createdAt) : null; 
        msg.updatedAt = origMsg.updatedAt ? util.formatDate(origMsg.updatedAt) : null; 
        msg.createdBy = origMsg.createdById ? removeAttributes(origMsg.createdById, ['_id']) : null; 
        msg.updatedBy = origMsg.updatedById ? removeAttributes(origMsg.updatedById, ['_id']) : null; 
        msg.lastPasswordResetDate = origMsg.lastPasswordResetDate ? util.formatDate(origMsg.lastPasswordResetDate) : null; 
 
        return msg; 
    } 
 
    /** 
     * Format subscription object 
     * @param {object} msg - Formatted msg object 
     * @param {object} origMsg - Original message 
     * @returns {object} 
     */ 
    function formatCarOwnerAttributes(msg, origMsg) { 
        msg.user = {}; 
        if (origMsg.userId) { 
            msg.user.id = origMsg.userId._id; 
            msg.user.email = origMsg.userId.email; 
            msg.user.firstName = origMsg.userId.firstName; 
            msg.user.lastName = origMsg.userId.lastName; 
            msg.company = origMsg.userId.company; 
        } 
        delete msg.userId; 
        return msg; 
    } 
 
    /** 
     * Populate S3 public URL for logo and banner 
     * @param {Object} msg - URL populated msg 
     * @param {object} origMsg - Original message 
     * @returns {object} 
     */ 
    function populateURL(msg, origMsg) { 
        let s3host = "s3.amazonaws.com/" + bucketName + "/"; 
        let logoURL = origMsg.logoName ? s3host + origMsg.logoName : s3host + defaultLogo; 
        let bannerURL = origMsg.bannerName ? s3host + origMsg.bannerName : s3host + defaultBanner; 
        msg.logo = "https://" + logoURL; 
        msg.banner = "https://" + bannerURL; 
        return msg; 
    } 
 
    /** 
     * Populate S3 public URL for images 
     * @param {String} image - Image name 
     * @returns {String} 
     */ 
    function populateS3URL(image) { 
        let s3host = "s3.amazonaws.com/" + bucketName + "/"; 
        let imageUrl = "https://" + s3host + image; 
        return imageUrl; 
    } 
 
    /** 
     * Prepare response JSON object for push notification info 
     * @param {object} pushNotificationInfo - JSON object 
     * @returns {object} 
     */ 
    function pushNotificationInfo(pushNotificationInfo) { 
 
        var msg = pushNotificationInfo; 
        msg = removeAttributes(pushNotificationInfo, ['_id', '__v', 'pushNotificationRequestId']); 
        msg.createdAt = msg.createdAt ? util.formatDate(msg.createdAt) : null; 
        // msg.text = autolinker.link(pushNotificationInfo.pushNotificationRequestId.text, {newWindow: false}); // Embed anchor tag to links 
 
        let s3host = "s3.amazonaws.com/" + bucketName + "/"; 
        let logoURL = (pushNotificationInfo.shopId && pushNotificationInfo.shopId.logoName) ? s3host + pushNotificationInfo.shopId.logoName 
            : s3host + defaultLogo; 
        msg.shop = {}; 
        if(pushNotificationInfo.shopId) { 
            msg.shop.id = pushNotificationInfo.shopId._id; 
            msg.shop.brandName = pushNotificationInfo.shopId.brandName; 
            msg.shop.businessName = pushNotificationInfo.shopId.businessName; 
        } 
        msg.shop.logo = "https://" + logoURL; 
        delete msg.shopId; 
 
        msg.id = pushNotificationInfo._id; 
        msg.action_taken = pushNotificationInfo.action_taken; 
        if(pushNotificationInfo.pushNotificationRequestId){ 
            msg.text = pushNotificationInfo.pushNotificationRequestId.text; 
            msg.title = pushNotificationInfo.pushNotificationRequestId.title; 
            msg.booking_id = pushNotificationInfo.pushNotificationRequestId.booking_id; 
            msg.type = pushNotificationInfo.pushNotificationRequestId.type; 
        } 
 
 
        return msg; 
    } 
 
    /** 
     * Format given number into digital time 
     * @param {Number} number 
     * @returns digital time in String 
     */ 
    function formatTime(number) { 
        var output = number + ''; 
        while (output.length < 4) { 
            output = '0' + output; 
        } 
        return output; 
    } 
 
    /** 
     * Prepare response JSON object for sync tool user creation 
     * @param {string} apiKey - Generated API key 
     * @param {string} apiSecret - Generated API secret 
     * @returns {object} 
     */ 
    function syncToolUser(apiKey, apiSecret) { 
        return { 
            'apiKey': apiKey, 
            'apiSecret': apiSecret 
        } 
    } 
 
    /** 
     * Prepare push notification info msg count object 
     * @param {Number} total Total number of messages 
     * @param {Number} unreadCount Unread message count 
     * @returns Object 
     */ 
    function pushNotificationInfoMsgCount(total, unreadCount) { 
        return { 
            'total': total, 
            'unread': unreadCount, 
            'read': (total-unreadCount) 
        }; 
    } 
 
    /** 
     * Prepare shop owner dashboard statistics response 
     * @param {Number} shopCount Total number of shops 
     * @param {Number} userCount Total number of users 
     * @param {Number} vehicleCount Vehicle count 
     * @param {Number} appointmentRequestCount Unread appointment request count 
     * @param {Number} chatCount Unread chat count 
     * @returns Object 
     */ 
    function shopOwnerDashboardStatistics(shopCount, userCount, vehicleCount, appointmentRequestCount, chatCount) { 
        return { 
            'shopCount': shopCount, 
            'userCount': userCount, 
            'vehicleCount': vehicleCount, 
            'appointmentRequestCount': appointmentRequestCount, 
            'chatCount': chatCount 
        }; 
    } 
 
    /** 
     * Prepare last sync details 
     * @param {Number} recommendationId Max recommendationId 
     * @param {Number} repairOrderId Max repair order id 
     * @param {Bool} isCustSynced Whether customers synced or not 
     * @param {Number} vehicleId Max vehicle id 
     * @returns Object 
     */ 
    function getLastSyncInfo(recommendationId, repairOrderId, isCustSynced, vehicleId) { 
        return { 
            'maxRecommendationId': recommendationId, 
            'maxRepairOrderId': repairOrderId, 
            'isCustSynced': isCustSynced, 
            'maxVehicleId': vehicleId 
        } 
    } 
 
    /** 
     * Prepare response JSON object for push notification request 
     * @param {object} pushNotificationRequest - JSON object 
     * @returns {object} 
     */ 
    function pushNotificationRequest(pushNotificationRequest) { 
        var msg = removeAttributes(pushNotificationRequest, ['_id', '__v', 'createdById', 'updatedById']); 
        msg = formatAttributes(msg, pushNotificationRequest); 
        msg.id = pushNotificationRequest._id; 
 
        var usersString = _.replace(JSON.stringify(msg.users), new RegExp("_id", "g"), 'id'); 
        msg.users = JSON.parse(usersString); 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for push notification templates 
     * @param {object} pushNotificationTemplate - JSON object 
     * @returns {object} 
     */ 
    function pushNotificationTemplate(pushNotificationTemplate) { 
        var msg = removeAttributes(pushNotificationTemplate, ['_id', '__v', 'createdById', 'updatedById']); 
        msg = formatAttributes(msg, pushNotificationTemplate); 
        msg.id = pushNotificationTemplate._id; 
 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for chat message 
     * @param {object} chatMessage - JSON object 
     * @returns {object} 
     */ 
    function chatMessage(chatMessage) { 
        var msg = removeAttributes(chatMessage, ['_id', '__v', 'createdById', 'updatedById', 'receiverId', 'senderId']); 
        msg = formatAttributes(msg, chatMessage); 
        msg.id = chatMessage._id; 
 
        // Attachments 
        let s3host = "https://s3.amazonaws.com/" + bucketName + "/"; 
        var attachmentsUrls = []; 
 
        for (var i=0; i<chatMessage.attachments.length; i++) { 
            var url = s3host + chatMessage.attachments[i]; 
            attachmentsUrls.push(url); 
        } 
 
        msg.attachments = attachmentsUrls; 
        // End 
 
        msg.receiver = JSON.parse(_.replace(JSON.stringify(chatMessage.receiverId), new RegExp("_id", "g"), 'id')); 
        msg.sender = JSON.parse(_.replace(JSON.stringify(chatMessage.senderId), new RegExp("_id", "g"), 'id')); 
 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for chat buddy 
     * @param {object} chatBuddy - JSON object 
     * @returns {object} 
     */ 
    function chatBuddy(chatBuddy) { 
        var msg = {}; 
        if(!isEmpty(chatBuddy)) { 
            msg.id = chatBuddy._id; 
            msg.firstName = chatBuddy.firstName; 
            msg.lastName = chatBuddy.lastName; 
            msg.email = chatBuddy.email; 
        } 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for reward 
     * @param {object} reward - JSON object 
     * @returns {object} 
     */ 
    function reward(reward) { 
        var msg = removeAttributes(reward, ['_id', '__v', 'createdById', 'updatedById']); 
        msg = formatAttributes(msg, reward); 
        msg.id = reward._id; 
        if (reward.userId) { 
            msg.user = {}; 
            msg.user.id = reward.userId._id; 
            msg.user.firstName = reward.userId.firstName; 
            msg.user.lastName = reward.userId.lastName; 
        } 
        delete msg.userId; 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for reward transaction 
     * @param {object} rewardTransaction - JSON object 
     * @returns {object} 
     */ 
    function rewardTransaction(rewardTransaction) { 
        var msg = removeAttributes(rewardTransaction, ['_id', '__v', 'createdById', 'updatedById', 'userId']); 
        msg = formatAttributes(msg, rewardTransaction); 
        msg.user = JSON.parse(_.replace(JSON.stringify(rewardTransaction.userId), new RegExp("_id", "g"), 'id')); 
        msg.id = rewardTransaction._id; 
        if (rewardTransaction.userId) { 
            let user = rewardTransaction.userId; 
            msg.user = { 
                id: user._id, 
                firstName: user.firstName, 
                lastName: user.lastName, 
                company: user.company 
            }; 
            delete msg.userId; 
        } 
        return msg; 
    } 
 
 
    /** 
     * Prepare response JSON object for shop 
     * @param {object} stripe - JSON object 
     * @returns {object} 
     */ 
    function stripe(stripe) { 
        var msg = stripe; 
        msg = populateURL(msg, stripe); 
        msg = removeAttributes(stripe, ['_id', '__v', 'createdById', 'updatedById', 'logoName', 'bannerName']); 
        msg = formatAttributes(msg, stripe); 
        msg = populateURL(msg, stripe); 
        msg.id = stripe._id; 
 
        return msg; 
    } 
 
    /** 
     * Prepare response JSON object for shop 
     * @param {object} stripe - JSON object 
     * @returns {object} 
     */ 
    function vehicleRepairMedia(object) { 
        var msg = []; 
        for(let i =0; i < object.length; i++) { 
            console.log(object[i]); 
 
            let tmpObj = removeAttributes(object[i], ['__v', 'createdById', 'updatedById', 'updatedAt']); 
            tmpObj.createdAt = util.toUSformatDate(object[i].createdAt); 
 
            if (tmpObj.content !== undefined) { 
                for (let k =0; k < tmpObj.content.length; k++) { 
                    tmpObj.content[k] = { image: populateS3URL(tmpObj.content[k].media), caption: tmpObj.content[k].caption, id: tmpObj.content[k]._id}; 
                } 
            } 
            tmpObj.id = object[i]._id; 
            msg.push(tmpObj); 
        } 
        return msg; 
    } 
 
    /** 
     * Export module fumctions to be accessed from outside 
     */ 
    module.exports = { 
        // Responses 
        commonResponse: commonResponse, 
        permission: permission, 
        user: user, 
        role: role, 
        userAuth: userAuth, 
        formatCreatedObject: formatCreatedObject, 
        shop: shop, 
        vehicle: vehicle, 
        vehicleRepairHistory: vehicleRepairHistory, 
        vehicleRecommendation: vehicleRecommendation, 
        subscribedShop: subscribedShop, 
        s3Response: s3Response, 
        pushNotificationInfo: pushNotificationInfo, 
        subscription: subscription, 
        autocompleteUser: autocompleteUser, 
        syncToolUser: syncToolUser, 
        pushNotificationInfoMsgCount: pushNotificationInfoMsgCount, 
        shopOwnerDashboardStatistics: shopOwnerDashboardStatistics, 
        bookingRequest: bookingRequest, 
        getLastSyncInfo: getLastSyncInfo, 
        pushNotificationRequest: pushNotificationRequest, 
        chatMessage: chatMessage, 
        chatBuddy: chatBuddy, 
        pushNotificationTemplate: pushNotificationTemplate, 
        rewardTransaction: rewardTransaction, 
        reward: reward, 
        stripe: stripe, 
        vehicleRepairMedia: vehicleRepairMedia, 
 
        // Error codes 
        SUCCESS: 'SUCCESS', 
        FAIL: 'FAIL', 
        MISSING_MANDATORY_ATTRIBUTE: 'MISSING_MANDATORY_ATTRIBUTE', 
        DUPLICATE_RECORD: 'DUPLICATE_RECORD', 
        RECORD_NOT_FOUND: 'RECORD_NOT_FOUND', 
        NO_DEVICE_FOUND: 'NO_DEVICE_FOUND', 
        NOT_FOUND: 'NOT_FOUND', 
        INVALID_EMAIL: 'INVALID_EMAIL', 
        EXCEED_CHARACTER_LENGTH: 'EXCEED_CHARACTER_LENGTH', 
        SUBCEED_CHARACTER_LENGTH: 'SUBCEED_CHARACTER_LENGTH', 
        INVALID_MOBILE: 'INVALID_MOBILE', 
        INVALID_USERNAME_PASSWORD: 'INVALID_USERNAME_PASSWORD', 
        USER_NOT_FOUND: 'USER_NOT_FOUND', 
        AUTH_FAILED: 'AUTH_FAILED', 
        PERMISSION_DENIED: 'PERMISSION_DENIED', 
        ROLE_IN_USE: 'ROLE_IN_USE', 
        PERMISSION_IN_USE: 'PERMISSION_IN_USE', 
        INVALID_OLD_PASSWORD: 'INVALID_OLD_PASSWORD', 
        UNKNOWN_ERROR: 'UNKNOWN_ERROR', 
        INVALID_OR_EXPIRED_TOKEN: 'INVALID_OR_EXPIRED_TOKEN', 
        INACTIVE_USER: 'INACTIVE_USER', 
        INVALID_USER_ID: 'INVALID_USER_ID', 
        INVALID_SHOP_ID: 'INVALID_SHOP_ID', 
        EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED', 
        INVALID_VERIFICATION_CODE: 'INVALID_VERIFICATION_CODE', 
        INVALID_INVITE_CODE: 'INVALID_INVITE_CODE', 
        INVITATION_EXPIRED: 'INVITATION_EXPIRED', 
        EMAIL_ALREADY_VERIFIED: 'EMAIL_ALREADY_VERIFIED', 
        INVALID_PHONE: 'INVALID_PHONE', 
        INVALID_FAX: 'INVALID_FAX', 
        ALREADY_SUBSCRIBED: 'ALREADY_SUBSCRIBED', 
        USER_NOT_REGISTERED: 'USER_NOT_REGISTERED', 
        USER_NOT_SUBSCRIBED: 'USER_NOT_SUBSCRIBED', 
        INVALID_DATA_TYPE: 'INVALID_DATA_TYPE', 
        INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT', 
        INVALID_DEVICE_TYPE: 'INVALID_DEVICE_TYPE', 
        DEFAULT_ROLE: 'DEFAULT_ROLE', 
        SOME_RECORDS_SYNCED: 'SOME_RECORDS_SYNCED', 
        RECORD_HAS_DEPENDENCIES: 'RECORD_HAS_DEPENDENCIES', 
        INVALID_BOOKING_DATE_TIME: 'INVALID_BOOKING_DATE_TIME', 
        INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS', 
        INVALID_ACTION: 'INVALID_ACTION', 
        INVALID_FILE_TYPE: 'INVALID_FILE_TYPE', 
        NO_FILES: 'NO_FILES' 
    } 
 
})(); 