var express = require("express");
var router = express.Router();
let userFun = require("../helper/userHelper");
var mongoose = require("mongoose");
let Product = require("../model/productSchema");
const startingHelper = require("../helper/startingHelper");

router.get("/add-dummy-data",async(req,res)=>{
  await startingHelper.createDummyData(req, res);
})
router.get("/add-dummy-charges",async(req,res)=>{
  await startingHelper.createDummyCharges(req, res);
})
module.exports = router;