const express = require('express');
const router = express.Router();
const checkoutHelprer = require('../helper/checkoutHelper');


router.get('/', async (req, res) => {
  const viewName = res.locals.customer?.language === 'ar'
    ? "pages/checkout/checkout_ar"
    : "pages/checkout/checkout";
  let checkoutData = await checkoutHelprer.getCheckoutData(req, res, viewName);
});

router.get('/ar', async (req, res) => {
  // checking user authentication is Already done as middleware in app.js
  let checkoutData = await checkoutHelprer.getCheckoutData(req, res, "pages/checkout/checkout_ar");
});
router.get('/api/delivery-charge', async (req, res) => {
  await checkoutHelprer.getDeliveryCharge(req, res);
});
router.get('/api/allowed-emirates', async (req, res) => {
  await checkoutHelprer.getAllowedEmirates(req, res);
});

router.post('/place-order', async (req, res) => {
  let checkoutData = await checkoutHelprer.getDataForCheckout(req, res);
  checkoutData.addressInputs = req.body
  console.log("Checkout Data:", checkoutData);
  let makeOrder = await checkoutHelprer.makeOrder(checkoutData, req, res);


  // return res.status(200).render("pages/checkout/checkout");
});
module.exports = router;
