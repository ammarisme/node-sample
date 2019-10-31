var express = require('express'); 
var path = require('path'); 
var favicon = require('serve-favicon'); 
var logger = require('morgan'); 
var cookieParser = require('cookie-parser'); 
var bodyParser = require('body-parser'); 
var db = require('./config/db'); 
var cors = require('cors'); 
 
var responseMessages = require('./lib/response-messages'); 
var authentication = require('./middlewares/authentication'); 
var init = require('./middlewares/init.js'); 
var cron = require('./lib/cron'); 
var socketServer = require('./lib/socket-server'); 
 
var index = require('./routes/index'); 
var permission = require('./routes/permission'); 
var user = require('./routes/user'); 
var role = require('./routes/role'); 
var mockUser = require('./routes/mock-user'); 
var shop = require('./routes/shop'); 
var util = require('./routes/util'); 
var deviceInfo = require('./routes/device-info'); 
var shopInvite = require('./routes/shop-invite'); 
var pushNotificationInfo = require('./routes/push-notification-info'); 
var carOwnerSubscription = require('./routes/car-owner-subscription'); 
var pushNotificationRequest = require('./routes/push-notification-request'); 
var vehicle = require('./routes/vehicle'); 
var googleReview = require('./routes/google-review'); 
var dashboard = require('./routes/dashboard'); 
var vehicleRepairHistory = require('./routes/vehicle-repair-history'); 
var vehicleRecommendation = require('./routes/vehicle-recommendation'); 
var bookingRequest = require('./routes/booking-request'); 
var chat = require('./routes/chat'); 
var pushNotificationTemplate = require('./routes/push-notification-template'); 
var rewardTransaction = require('./routes/reward-transaction'); 
var reward = require('./routes/reward'); 
var stripe = require('./routes/stripe'); 
var vehicleRepairMedia = require('./routes/vehicle-repair-media'); 
 
var app = express(); 
 
// Enable CORS 
app.use(cors()); 
 
// view engine setup 
app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'pug'); 
 
// uncomment after placing your favicon in /public 
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico'))); 
app.use(logger('dev')); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(cookieParser()); 
app.use(express.static(path.join(__dirname, 'public'))); 
 
// Initialize request 
app.use(function(req, res, next) { 
    init.initialize(req, res, next); 
}); 
 
// Authenticate all requests 
app.use(function(req, res, next) { 
    // Attach socket server to the request 
    req.socketServer = socketServer; 
    authentication.authRequest(req, res, next); 
}); 
 
app.use('/', index); 
app.use('/v1/permission', permission); 
app.use('/v1/user', user); 
app.use('/v1/role', role); 
app.use('/v1/mock-user', mockUser);//Actions 
//2342342342     
// a description cfsfsf 
 
// ······   ·Go To Chat·Edit 
 
app.use('/v1/shop', shop); 
app.use('/v1/util', util); 
app.use('/v1/device-info', deviceInfo); 
app.use('/v1/shop-invite', shopInvite); 
app.use('/v1/push-notification-info', pushNotificationInfo); 
app.use('/v1/car-owner-subscription', carOwnerSubscription); 
app.use('/v1/push-notification-request', pushNotificationRequest); 
app.use('/v1/vehicle', vehicle); 
app.use('/v1/google-review', googleReview); 
app.use('/v1/dashboard', dashboard); 
app.use('/v1/vehicle-repair-history', vehicleRepairHistory); 
app.use('/v1/vehicle-recommendation', vehicleRecommendation); 
app.use('/v1/booking-request', bookingRequest); 
app.use('/v1/chat', chat); 
app.use('/v1/push-notification-template', pushNotificationTemplate); 
app.use('/v1/reward', reward); 
app.use('/v1/reward-transaction', rewardTransaction); 
app.use('/v1/stripe', stripe); 
app.use('/v1/vehicle-repair-media', vehicleRepairMedia); 
 
// catch 404 and forward to error handler 
app.use(function(req, res, next) { 
    response = responseMessages.commonResponse(responseMessages.NOT_FOUND); 
    res.status(404).json(response); 
}); 
 
// Error handler 
app.use(function(err, req, res, next) { 
    // set locals, only providing error in development 
    // res.locals.message = err.message; 
    // res.locals.error = req.app.get('env') === 'development' ? err : {}; 
 
    // render the error page 
    // res.status(err.status || 500); 
    // res.render('error'); 
    response = responseMessages.commonResponse(responseMessages.UNKNOWN_ERROR, '', '',err.message); 
    res.status(500).json(response); 
}); 
 
module.exports = app; 