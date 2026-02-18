var express = require('express');
var mongoose = require("mongoose");
var router = express.Router();
const customerHelper = require("../helper/customerHelper")
const asyncHandler = require('../helper/asyncHandler');
/* GET users listing. */
router.get('/login', function (req, res, next) {
  const lang = res.locals.customer ? res.locals.customer.language : 'en';
  if (lang === 'ar') {
    res.render("pages/user-Auth/auth_Ar");
  } else {
    res.render("pages/user-Auth/auth");
  }
});
router.post('/api/auth/signup', asyncHandler(async function (req, res, next) {
  await customerHelper.checkAndGenerateOTPUser(req, res)
}));
router.post('/api/auth/verify-otp', asyncHandler(async function (req, res, next) {
  await customerHelper.verifyOTPUser(req, res)
}));

router.get('/send-msg', asyncHandler(async function (req, res, next) {
  await customerHelper.sendOTP(req, res)
  const lang = res.locals.customer ? res.locals.customer.language : 'en';
  if (lang === 'ar') {
    res.render("pages/user-Auth/auth_Ar");
  } else {
    res.render("pages/user-Auth/auth");
  }
}));
module.exports = router;
