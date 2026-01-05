var express = require('express');
var mongoose = require("mongoose");
var router = express.Router();
const customerHelper = require("../helper/customerHelper")
/* GET users listing. */
router.get('/login', function(req, res, next) {
  res.render("pages/user-Auth/auth")
});
router.post('/api/auth/signup',async function(req, res, next) {
  console.log(req.body);
  await customerHelper.checkAndGenerateOTPUser(req, res)
});
router.post('/api/auth/verify-otp',async function(req, res, next) {
  console.log(req.body);
  await customerHelper.verifyOTPUser(req, res)
 
});

router.get('/send-msg',async function(req, res, next) {
  await customerHelper.sendOTP(req, res)
  res.render("pages/user-Auth/auth")
});
module.exports = router;
