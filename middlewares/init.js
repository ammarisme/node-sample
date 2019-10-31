/** 
 * @name init.js 
 * @fileOverview Middleware to initialize global objects. Ex logging. 
 * @author Aruna Attanayake 
 */ 
 
(function() { 
 
    'use strict'; 
 
    var _ = require('lodash'); 
    var uniqid = require('uniqid'); 
    var Logger = require('../lib/logger').Logger; 
 
    /** 
     * Authenticate request 
     * @param {object} req - Request data 
     * @param {object} res - Response data 
     * @param {object} next - Next data 
     */ 
    function initialize(req, res, next) { 
        var logger = new Logger(); 
 
        // Set common log data 
        logger.logData.ip = req.connection.remoteAddress; 
        logger.logData.uniqid = uniqid(); 
        logger.logData.action = req.path; 
        logger.logData.method = req.method; 
 
        // Set logger object to request. Where it can be accessed from anywhere 
        req.logger = logger; 
 
        // Response logging 
        var oldWrite = res.write, 
        oldEnd = res.end; 
 
        var chunks = []; 
 
        res.write = function (chunk) { 
            chunks.push(chunk); 
            oldWrite.apply(res, arguments); 
        }; 
 
        res.end = function (chunk) { 
            if (chunk) 
                chunks.push(chunk); 
 
            var body = Buffer.concat(chunks).toString('utf8'); 
            req.logger.writeLog('Response sent', body); 
 
            oldEnd.apply(res, arguments); 
        }; 
        // End 
 
        // Log request data 
        let bodyData = _.cloneDeep(req.body); 
        if (bodyData && bodyData.password) { 
            delete bodyData.password; 
        } 
        var requestData = JSON.stringify([{ 'queryParams': req.query }, { 'bodyParams': bodyData }]); 
        logger.writeLog('Request received.', requestData); 
 
        next(); 
    } 
 
    /** 
     * Export module fumctions to be accessed from outside 
     */ 
    module.exports = { 
        initialize: initialize 
    } 
 
})(); 