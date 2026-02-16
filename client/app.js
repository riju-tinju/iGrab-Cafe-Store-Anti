const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const getCustomer = require('./helper/getCustomer');
const verifyCustomer = require('./helper/verifyCustomer');

var startingRouter = require('./routes/startingRouter');
var indexRouter = require('./routes/index');
var apiRouter = require('./routes/apiRouter')
var checkoutRouter = require('./routes/checkout');
var userAuthRouter = require('./routes/userAuth');
var stripeWebhookRouter = require('./routes/stripe-webhookRouter');

require("dotenv").config();
const db = require("./config/connection");
db.DBconnect();

var app = express();

// Trust Proxy (Required for Nginx/Heroku/Load Balancers)
app.set('trust proxy', 1);

// Security Headers with CSP configuration
// TEMPORARILY DISABLED FOR TESTING

// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: [
//         "'self'",
//         "'unsafe-inline'", // Required for inline scripts in EJS templates
//         "'unsafe-eval'", // Required for Alpine.js and other frameworks that use Function()
//         "https://cdn.jsdelivr.net",
//         "https://unpkg.com",
//         "https://js.stripe.com",
//         "https://maps.googleapis.com",
//         "https://fonts.googleapis.com",
//         "https://cdnjs.cloudflare.com",
//         "https://stackpath.bootstrapcdn.com",
//         "https://code.jquery.com"
//       ],
//       styleSrc: [
//         "'self'",
//         "'unsafe-inline'", // Required for inline styles and Tailwind
//         "https://cdn.jsdelivr.net",
//         "https://unpkg.com",
//         "https://fonts.googleapis.com",
//         "https://cdnjs.cloudflare.com",
//         "https://stackpath.bootstrapcdn.com",
//         "https://use.fontawesome.com"
//       ],
//       fontSrc: [
//         "'self'",
//         "data:",
//         "https://fonts.gstatic.com",
//         "https://cdn.jsdelivr.net",
//         "https://cdnjs.cloudflare.com",
//         "https://use.fontawesome.com",
//         "https://stackpath.bootstrapcdn.com"
//       ],
//       imgSrc: [
//         "'self'",
//         "data:",
//         "blob:",
//         "https:",
//         "http:",
//         "https://images.unsplash.com"
//       ],
//       connectSrc: [
//         "'self'",
//         "https://api.stripe.com",
//         "https://maps.googleapis.com"
//       ],
//       frameSrc: [
//         "'self'",
//         "https://js.stripe.com",
//         "https://hooks.stripe.com"
//       ],
//       objectSrc: ["'none'"],
//       mediaSrc: ["'self'"]
//     }
//   }
// }));


// NoSQL Injection Protection
app.use(mongoSanitize());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later'
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests, please try again later'
});
app.use('/userAuth/', authLimiter);

// Setup session middleware with MongoDB store
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
  console.warn('WARNING: SESSION_SECRET not set in .env. Using a generated random secret.');
}

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: `mongodb://localhost:27017/${process.env.DB_NAME || 'iGrab_DB'}`,
      collectionName: 'client_sessions',
      ttl: 14 * 24 * 60 * 60, // 14 days in seconds
      autoRemove: 'native', // Let MongoDB handle expired session cleanup
      touchAfter: 24 * 3600, // Lazy session update - update session once per 24 hours
      crypto: {
        secret: sessionSecret
      }
    }),
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  })
);

// Session Debug Middleware
app.use((req, res, next) => {
  console.log('--- Session Debug ---');
  console.log('Session ID:', req.sessionID);
  console.log('Session User:', req.session.user);
  console.log('Cookie:', req.session.cookie);
  console.log('Headers:', req.headers);
  console.log('---------------------');
  next();
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set the partials directory
app.locals.partials = path.join(__dirname, 'views/partials');

app.use('/stripe-webhook', stripeWebhookRouter);
app.use(logger('dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../uploads')));

// Apply to all frontend routes
app.use('/', startingRouter);
app.use(getCustomer);
app.use((req, res, next) => {
  res.locals.homeUrl = `https://${req.get('host')}`; //${req.protocol} for http
  res.locals.fullUrl = `${res.locals.homeUrl}${req.originalUrl}`;
  next();
});
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
