require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const verifyAdmin = require('./helper/verifyAdmin');
const verifySuperAdmin = require('./helper/verifySuperAdmin');

var indexRouter = require('./routes/index');
var adminUserRouter = require('./routes/adminUserSetting');
var deliveryExecutiveRouter = require('./routes/deliveryExecutiveSetting');
var productRouter = require('./routes/product');
var orderRouter = require('./routes/order');
var adminAuthRouter = require('./routes/adminAuth');
var dashboardRouter = require('./routes/dashboard');
var settingRouter = require('./routes/settings')
var contactRouter = require('./routes/contacts');

const getAdmin = require('./helper/getAdmin');
require("dotenv").config();// custom
const db = require("./config/connection");// custom
db.DBconnect();// custom
const adminHelper = require("./helper/adminHelper");
adminHelper.ensureInitialData(); // Seed initial data if database is empty

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../uploads')));


app.use('/', adminAuthRouter)
app.use(verifyAdmin);
app.use(getAdmin);

app.use('/', dashboardRouter);
app.use('/', indexRouter);
app.use('/', productRouter);
app.use('/', orderRouter);
app.use('/', settingRouter);
app.use('/', deliveryExecutiveRouter);
app.use('/', contactRouter);
app.use(verifySuperAdmin);
app.use('/', adminUserRouter);

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
