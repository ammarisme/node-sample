
/** 
 * @name util.js 
 * @fileOverview Helper class to handle various utility functions 
 * @author Aruna Attanayake 
 */ 
 
(function() { 
 
    'use strict'; 
   
      const momentTimezone = require('moment-timezone'); 
      var moment = require('moment'); 
      var _ = require('lodash'); 
   
      /** 
       * Format mongodb date to human readable 
       * @param {string} date - Mongodb date string 
       * @param {string} format - Date format 
       * @returns {string} 
       */ 
      function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') { 
          return moment(date).utc().format(format); 
      } 
     
    function formatUTCDate(date, timezone, format = 'YYYY-MM-DD HH:mm:ss') { 
        let currentDate = momentTimezone(date).tz(timezone); 
        if(typeof currentDate === 'undefined'){ 
                currentDate = moment(date).utc().format(format); 
            } else { 
                currentDate = momentTimezone(date).tz(timezone).format(format); 
            } 
        return currentDate; 
    } 
   
      /** 
       * Format mongodb date to US date format 
       * @param {string} date - Mongodb date string 
       * @param {string} format - Date format 
       * @returns {string} 
       */ 
      function toUSformatDate(date) { 
          return moment(date).local().format("MM-DD-YYYY"); 
      } 
   
      /** 
       * Check whether user has permission to parituclar action 
       * @param {string} date - Mongodb date string 
       * @returns {string} 
       */ 
      function hasPermission(permission, userPermissions) { 
          if (_.indexOf(userPermissions, permission) > -1) { 
              return true; 
          } else { 
              return false; 
          } 
      } 
   
      /** 
       * Image types 
       * @returns {Array} 
       */ 
      function imageTypes() { 
          return ["image/png", "image/jpeg"]; 
      } 
   
      /** 
       * Export module fumctions to be accessed from outside 
       */ 
      module.exports = { 
          formatDate: formatDate, 
            formatUTCDate: formatUTCDate, 
          hasPermission: hasPermission, 
          imageTypes: imageTypes, 
          toUSformatDate: toUSformatDate 
      } 
   
  })();  
