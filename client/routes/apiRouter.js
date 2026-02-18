const express = require('express');
const router = express.Router();
const apiFun = require('../helper/apiHelper');
const asyncHandler = require('../helper/asyncHandler');
router.post('/add-or-remove-wishlist', asyncHandler(async (req, res) => {
  await apiFun.wishlistAction(req, res)
}));

let wishlistItems = [
  {
    id: 1,
    name: "Espresso",
    description: "Single shot",
    price: 3.5,
    image:
      "https://images.unsplash.com/photo-1497636577773-f1231844b336?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: 2,
    name: "Cappuccino",
    description: "With milk foam",
    price: 4.2,
    image:
      "https://images.unsplash.com/photo-1534687941688-651ccaafbff8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: 3,
    name: "Croissant",
    description: "Butter",
    price: 3.8,
    image:
      "https://images.unsplash.com/photo-1534687941688-651ccaafbff8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: 4,
    name: "Matcha Latte",
    description: "Hot or Iced",
    price: 5.2,
    image:
      "https://images.unsplash.com/photo-1497636577773-f1231844b336?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: 1,
    name: "Espresso1",
    description: "Single shot",
    price: 3.5,
    image:
      "https://images.unsplash.com/photo-1497636577773-f1231844b336?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
];
router.post('/get-wishlist', asyncHandler(async (req, res) => {
  await apiFun.getWishlist(req, res);
}));

router.post("/remove-wishlist/", asyncHandler(async (req, res) => {
  await apiFun.removeItemFromWishlist(req, res);
}));
router.post("/remove-item-from-cart", asyncHandler(async (req, res) => {
  let cartAfteritemRemoval = await apiFun.removeItemFromCart(req, res);
}));
router.post("/update-cartItem-qty", asyncHandler(async (req, res) => {
  let updateCartQty = await apiFun.updateCartQty(req, res);
}));
router.post("/update-cartItem-qty-for-product-page", asyncHandler(async (req, res) => {
  let updateCartQty = await apiFun.updateCartQtyForProductPage(req, res);
}));
router.post("/cart/add", asyncHandler(async (req, res) => {
  await apiFun.addToCart(req, res);
}));

router.post("/get-cart", asyncHandler(async (req, res) => {
  let cartArray = await apiFun.getCartArray(req, res);
  let getStructuredCart = await apiFun.getStructuredCart(cartArray, req, res);
  res.status(200).json(getStructuredCart);
}));

router.post("/addItemToCartFromWishlist", asyncHandler(async (req, res) => {
  await apiFun.addItemToCartFromWishlist(req, res);
}));

router.post("/addAlltoCartFromWishlist", asyncHandler(async (req, res) => {
  await apiFun.addAlltoCartFromWishlist(req, res);
}));

router.post("/change-language", asyncHandler(async (req, res) => {
  let setLang = await apiFun.setLang(req, res)
}));

router.post("/change-branch", asyncHandler(async (req, res) => {
  let setBranch = await apiFun.setBranch(req, res)
}));

router.post("/logOut", asyncHandler(async (req, res) => {
  await new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  res.clearCookie('connect.sid'); // Clear the session cookie
  res.status(200).json({ success: true, message: "Logged out successfully" });
}));

router.post("/get-order-history", asyncHandler(async (req, res) => {
  let orderHistory = await apiFun.getOrderHistory(req, res);
  // res.status(200).json(orderHistory);
}));

router.post("/subscribe-newsletter", asyncHandler(async (req, res) => {
  await apiFun.subscribeNewsletter(req, res);
}));



module.exports = router;
