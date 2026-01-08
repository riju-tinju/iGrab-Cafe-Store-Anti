var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const getCustomer = require('./helper/getCustomer');
const verifyCustomer = require('./helper/verifyCustomer');

var startingRouter = require('./routes/startingRouter');
var indexRouter = require('./routes/index');
var apiRouter = require('./routes/apiRouter')
var checkoutRouter = require('./routes/checkout');
var userAuthRouter = require('./routes/userAuth');
var stripeWebhookRouter = require('./routes/stripe-webhookRouter');

require("dotenv").config();// custom
const db = require("./config/connection");// custom
db.DBconnect();// custom

var app = express();

// Setup session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'supersecretkey', // use env for security
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
      httpOnly: true, // set to true if you want to prevent client-side access to the cookie
      secure: false // set to true if using HTTPS
    }
  })
);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set the partials directory
app.locals.partials = path.join(__dirname, 'views/partials'); //custom

app.use('/stripe-webhook', stripeWebhookRouter);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../uploads')));

// Apply to all frontend routes
app.use('/', startingRouter);
app.use(getCustomer);
app.use('/', indexRouter);
app.use('/', userAuthRouter);
app.use('/api', apiRouter)
app.use(verifyCustomer);
app.use('/checkout', checkoutRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
