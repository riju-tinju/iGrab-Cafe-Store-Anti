var express = require('express');
var router = express.Router();
const Admin = require("../model/adminSchema");
const settingHelper = require("../helper/settingHelper");

const upload = require("../helper/upload");

// GET home page.
router.get('/setting/', function (req, res, next) {
  res.render('pages/setting/setting', { googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY });
});

router.get('/api/settings/business', async function (req, res, next) {
  await settingHelper.getBusinessInfo(req, res, next);
});

router.put('/api/settings/business', async function (req, res, next) {
  console.log(req.body)
  await settingHelper.putBusinessInfo(req, res, next);
});

router.post('/api/settings/upload', upload.single('logo'), async function (req, res, next) {
  console.log(req.body)
  console.log(req.files)

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
      code: "NO_FILE"
    });
  }

  // Save filename to DB (example)
  // const newImage = new ProductImage({
  //   filename: req.file.filename,
  //   path: `/uploads/${req.file.filename}`
  // });
  // await newImage.save();

  res.status(200).json({
    success: true,
    data: {
      url: `/uploads/${req.file.filename}` // Return the file path
    }
  });

  // await settingHelper.createLogo(req, res,req.files[0]?.filename || null);
});

router.get('/api/branches', async (req, res) => {
  await settingHelper.getBranches(req, res)
})

// creating branch
router.post('/api/branches', async (req, res) => {
  console.log(req.body)
  await settingHelper.createBranch(req, res)
})

router.delete('/api/branches/:id', async (req, res) => {
  await settingHelper.deleteBranch(req, res)
})

router.put('/api/branches/:id', async (req, res) => {
  await settingHelper.editBranch(req, res)
})

router.get('/api/settings/payment', async (req, res) => {
  await settingHelper.getPayment(req, res)
})

router.put('/api/settings/payment', async (req, res) => {
  // console.log(req.body)
  await settingHelper.editPayment(req, res)
})

router.get('/api/settings/seo', async (req, res) => {
  await settingHelper.getSeo(req, res)
})

router.put('/api/settings/seo', async (req, res) => {
  await settingHelper.editSeo(req, res)
})

router.get('/api/charges', async (req, res) => {
  await settingHelper.getCharges(req, res)
})

router.post('/api/charges', async (req, res) => {
  console.log(req.body)
  await settingHelper.createCharge(req, res)
})

router.put('/api/charges/:id', async (req, res) => {
  console.log(req.body)
  console.log(req.params.id)
  await settingHelper.editCharge(req, res)
})

router.delete('/api/charges/:id', async (req, res) => {
  await settingHelper.deleteCharge(req, res)
})

// Delivery Charges Routes
router.get('/api/delivery-charges', async (req, res) => {
  await settingHelper.getDeliveryCharges(req, res);
});

router.post('/api/delivery-charges', async (req, res) => {
  // console.log(req.body);
  await settingHelper.createDeliveryCharge(req, res);
});

router.put('/api/delivery-charges/:id', async (req, res) => {
  // console.log(req.body);
  await settingHelper.editDeliveryCharge(req, res);
});

router.delete('/api/delivery-charges/:id', async (req, res) => {
  await settingHelper.deleteDeliveryCharge(req, res);
});

module.exports = router;
