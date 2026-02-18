var express = require("express");
var router = express.Router();
let userFun = require("../helper/userHelper");
var mongoose = require("mongoose");
let Product = require("../model/productSchema");
const startingHelper = require("../helper/startingHelper");
const asyncHandler = require('../helper/asyncHandler');

router.get("/add-dummy-data", asyncHandler(async (req, res) => {
  await startingHelper.createDummyData(req, res);
}));
router.get("/add-dummy-charges", asyncHandler(async (req, res) => {
  await startingHelper.createDummyCharges(req, res);
}));
module.exports = router;