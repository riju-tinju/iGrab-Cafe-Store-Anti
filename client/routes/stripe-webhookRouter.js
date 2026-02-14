var express = require("express");
var router = express.Router();
const bodyParser = require('body-parser');
let userFun = require("../helper/userHelper");
var mongoose = require("mongoose");
let Product = require("../model/productSchema");
const gaetCustomer = require("../helper/getCustomer");
const startingHelper = require("../helper/startingHelper");
const checkoutHelper = require("../helper/checkoutHelper");
const Payment = require("../model/paymentSchema");

// Match the raw body to content type application/json
router.post('/', bodyParser.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    const secretKey = paymentSettings?.stripe?.secretKey;
    const webhookSecret = paymentSettings?.stripe?.webhookSecret;

    if (!secretKey) {
      console.error("Stripe Secret Key not found");
      return response.status(500).send("Stripe Secret Key not configured");
    }

    const stripeInstance = require('stripe')(secretKey);

    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Handle the successful payment intent
      handlePaymentIntentSucceeded(paymentIntent)
        .then(() => console.log('Payment processed successfully'))
        .catch(err => console.error('Error processing payment:', err));
      break;

    // Add other event types you want to handle
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.sendStatus(200);
});

async function handlePaymentIntentSucceeded(paymentIntent) {
  // Get the orderId from metadata
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.warn('No orderId found in payment intent metadata');
    return;
  }

  console.log(`PaymentIntent ${paymentIntent.id} succeeded for order ${orderId}`);
  await checkoutHelper.updateOrderStatusAfterPayment(paymentIntent);
  // Here you would typically:
  // 1. Update your database to mark the order as paid
  // 2. Send a confirmation email
  // 3. Trigger any post-payment processes

  // Example:
  // await updateOrderStatus(orderId, 'paid');
  // await sendConfirmationEmail(paymentIntent.customer, orderId);
}

module.exports = router;