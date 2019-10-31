
/** 
 * @name stripe.js 
 * @fileOverview Wrapper module for handling Stripe functionalities  
 * @author Fazlul 
 */ 
 
(function() { 
 
    'use strict'; 
   
    var config = require('config'); 
      const stripe = require('stripe')(config.get('stripe.key')); 
   
      /** 
       * Create customer in Stripe along with card and billing details (provided from front-end) 
       * @param {Object} data  
       *    - Customer email 
       *    - Stripe encrypted token (card details, shipping details and etc) 
       * @returns {Object} - Customer details Object which send from Stripe 
       */ 
      function createCustomer(data, callback) { 
 
        stripe.customers.create( 
          { email: data.stripeEmail, source: data.stripeToken }, 
            function(err, customer) { 
              callback(err, customer); 
          } 
        ); 
      } 
 
 
       /** 
       * Charge the Stripe customer 
       * @param {Object} data  
       *    - Amount to charge 
       *    - Currency Type 
       *    - Stripe Customer id 
       * @returns {Object} - Customer details Object which send from Stripe 
       */ 
      async function chargeCustomer(data) { 
 
          return await stripe.charges.create({ 
          amount:  data.amount, 
          currency:  data.currency, 
          customer: data.customerId, 
        }); 
      } 
 
      /** 
       * Subscribe the customer to the stripe plan id 
       * @param {Object} data  
       *    - Stripe Customer id 
       * @returns {Object} - Customer details Object which send from Stripe 
       */ 
      async function subscribe(data) { 
         
        return await  stripe.subscriptions.create({ 
          customer: data.customerId, 
          items: [{plan: config.get('stripe.plan')}], 
          tax_percent: data.tax_percent, 
        }); 
      } 
 
       /** 
       * Identify the Stripe error and status code 
       * @param {Object} type  
       * - Stripe error type 
       * - Stripe error Message 
       * - Stripe error caused parameter 
       * @returns {Object} - Stripe error message and code 
       */ 
      function stripeResponseError(StripeError) { 
         
        let error = {}; 
        const errType = (StripeError.type ? StripeError.type : ''); 
        const errMsg = (StripeError.msg ? StripeError.msg : ''); 
        const errParam = (StripeError.param ? StripeError.param : ''); 
 
        switch (errType) { 
          case 'StripeCardError': 
            // A declined card error 
            error = { statusCode: 400, type: errType, message: errMsg, param: errParam } 
            break; 
          case 'StripeInvalidRequestError': 
            // Invalid parameters were supplied to Stripe's API 
            error = { statusCode: 400, type: errType, message: errMsg, param: errParam } 
            break; 
          case 'StripeAPIError': 
            // An error occurred internally with Stripe's API 
            error = { statusCode: 500, type: errType, message: errMsg, param: errParam } 
            break; 
          case 'StripeConnectionError': 
            // Some kind of error occurred during the HTTPS communication 
            error = { statusCode: 500, type: errType, message: errMsg, param: errParam } 
            break; 
          case 'StripeAuthenticationError': 
            // You probably used an incorrect API key 
            error = { statusCode: 401, type: errType, message: errMsg, param: errParam } 
            break; 
          case 'StripeRateLimitError': 
            // Too many requests hit the API too quickly 
            error = { statusCode: 429, type: errType, message: errMsg, param: errParam } 
            break; 
          default: 
            // Unknown 
            error = { statusCode: 500, type: errType, message: errMsg, param: errParam } 
        } 
 
        return  error; 
      } 
 
 
       /** 
       * Identify the Stripe error and status code 
       * @returns {Array} - Subscription and Registration status 
       */ 
      function  subscriptionAndRegistrationStatus() { 
        return ['PENDING', 'REJECTED', 'AUTHORIZED']; 
      } 
   
 
      function getUpComingInvoice(customerId) { 
        return new Promise((resolve, reject) => { 
          stripe.invoices.retrieveUpcoming( 
            customerId, 
            function(err, upcoming) { 
              if (err) { 
                reject(err) 
              } else { 
                resolve({"upComingInvoice": upcoming}); 
              } 
               
            } 
          ); 
        }) 
      } 
 
      function getLastPaidInvoice(customerId) { 
        return new Promise((resolve, reject) => { 
          resolve({"lastPaidInvoice": ''}); 
        }); 
      } 
   
      /** 
       * Export module functions to be accessed from outside 
       */ 
      module.exports = { 
        createCustomer, 
        stripeResponseError, 
        subscriptionAndRegistrationStatus, 
        chargeCustomer, 
        subscribe, 
        getUpComingInvoice, 
        getLastPaidInvoice 
      } 
   
  })(); 