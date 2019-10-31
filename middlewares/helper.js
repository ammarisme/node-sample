/** 
 * @name authentication.js 
 * @fileOverview Authenticate each API requests. Perform JWT validation and API key validations 
 * @author Aruna Attanayake 
 */ 
 
(function() { 
 
    'use strict'; 
 
    var config = require('config'); 
    var User = require('../models/user'); 
    var isEmpty = require('is-empty'); 
    var _ = require('lodash'); 
    var uniqid = require('uniqid'); 
    var responseMessages = require('../lib/response-messages'); 
    var urlPattern = require('url-pattern'); 
    var proxy = require('http-proxy').createProxyServer({}), 
        proxyApiKey, 
        proxyApiSecret; 
 
    /** 
     * Authenticate request 
     * @param {object} req - Request data 
     * @param {object} res - Response data 
     * @param {object} next - Next data 
     */ 
    function authRequest(req, res, next) { 
        var logger = req.logger; 
 
        if (req.headers["api-key"] == config.get('api.key') && req.headers["api-secret"] == config.get('api.secret')) { 
            if (isGuestAction(req.path, req.method)) { 
                logger.writeLog('Guest action.'); 
                // No need to check access token for guest actions 
                next(); 
            } else { 
                if (!isEmpty(req.headers['authorization'])) { 
                    var jwt = req.headers['authorization']; 
                    jwt = jwt.replace('Bearer', ''); 
                    jwt = jwt.trim(); 
 
                    var tokenInfo = User.validateJwt(jwt); 
 
                    if (!isEmpty(tokenInfo)) { 
                        // JWT validation success & set user data to the request where it can be accessed from  
                        // anyewhere 
                        logger.writeLog('Authorization token validation success'); 
                        req.user = tokenInfo; 
 
                        User.getWithPermissions(tokenInfo.userId, (err, user) => { 
                            if (user) { 
                                var permissions = User.extractPermission(user.roleId); 
                                req.user.pemissions = permissions; 
                                req.user.userType = user.userType; 
                                req.user.shopId = user.shopId; 
                                req.user.lastName = user.lastName; 
 
                                // Set email to log object 
                                req.logger.logData.email = user.email ? user.email : user.sysEmail; 
 
                                if (req.path.startsWith(config.get("reviewServer.requestPath")) && 
                                    // We have a POST method that has to be skipped from proxying 
                                    req.method != 'POST') { 
                                    proxy = require('http-proxy').createProxyServer({ 
                                        target: config.get('reviewServer.baseUrl') 
                                    }); 
                                    proxyApiKey = config.get('reviewServer.apiKey'); 
                                    proxyApiSecret = config.get('reviewServer.apiSecret'); 
                                    proxyConnection(req, res, next); 
                                } 
                                // else if () Plug microservices here 
                                else { 
                                    next(); 
                                } 
                            } else { 
                                logger.writeLog('User not found'); 
                                var response = responseMessages.commonResponse(responseMessages.AUTH_FAILED,  
                                    null, null, 'User not found'); 
                                res.status(401).json(response); 
                            } 
                        }); 
                    } else { 
                        logger.writeLog('Invalid authorization token'); 
                        var response = responseMessages.commonResponse(responseMessages.AUTH_FAILED,  
                            null, null, 'Invalid Authorization token'); 
                        res.status(401).json(response); 
                    } 
                } else { 
                    logger.writeLog('Authorization token not provided'); 
                    var response = responseMessages.commonResponse(responseMessages.AUTH_FAILED, null,  
                        null, 'Authorization token is required'); 
                    res.status(401).json(response); 
                } 
            } 
        } else { 
            logger.writeLog('API access keys not provided'); 
            var response = responseMessages.commonResponse(responseMessages.AUTH_FAILED, null,  
                null, 'API access keys are required'); 
            res.status(401).json(response); 
        } 
    } 
 
    /** 
     * Check whether current request is a guest action request 
     * @param {string} url - Request url 
     * @param {string} method - Request method. Ex:POST, GET 
     * @return {boolean} 
     */ 
    function isGuestAction(url, method) { 
        var isGuestAction = false; 
        var guestActions = config.get('api.guestActions'); 
        for (var i=0; i<guestActions.length; i++) { 
            let pattern = new urlPattern(guestActions[i].url); 
            let matchRes = pattern.match(url); 
 
            if (method == guestActions[i].method && matchRes) { 
                if (!isEmpty(matchRes.id) && !isEmpty(guestActions[i].ignore)) { 
                    if (_.indexOf(guestActions[i].ignore, matchRes.id) > -1) { 
                        return false; 
                    } else { 
                        return true; 
                    } 
                } else { 
                    return true; 
                } 
            } 
        } 
        return isGuestAction; 
    } 
 
    /** 
     * Get lsit of review objects from review msg 
     * @param {Request} req  
     * @param {Response} res  
     * @param {function} next  
     */ 
    function proxyConnection(req, res, next) { 
        let logger = req.logger; 
        logger.writeLog('Proxying request ' + req.path); 
 
        if (req.user.userType != User.UT_SYS_USER) { 
            // If requesting user is non system user forcefully set user id to query param 
            var proxiedUrl = req.baseUrl; 
            var url = require('url'); 
            var url_parts = url.parse(req.url, true); 
            delete url_parts.query.userId; 
            url_parts.query.userId = req.user.userId; 
            req.url = url.format(url_parts); 
        } 
        proxy.web(req, res, next); 
    }; 
 
 
    proxy.on('proxyReq', function (proxyReq, req, res, options) { 
        proxyReq.setHeader('api-key', proxyApiKey); 
        proxyReq.setHeader('api-secret', proxyApiSecret); 
        proxyReq.setHeader('Content-Type', 'application/json'); 
    }); 
 
    proxy.on('error', function (err) { 
        let log = new Logger(); 
        log.logData.logType = log.API; 
        log.logData.action = 'proxy'; 
        log.writeLog(err); 
    }); 
     
    /** 
     * Export module fumctions to be accessed from outside 
     */ 
    module.exports = { 
        authRequest: authRequest 
    } 
 
})(); 

