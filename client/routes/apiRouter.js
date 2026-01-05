const express = require('express');
const router = express.Router();
const apiFun = require('../helper/apiHelper');
router.post('/add-or-remove-wishlist', async (req, res) => {
  console.log("API route for wishlist action hit");
  await apiFun.wishlistAction(req, res)
})

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
router.post('/get-wishlist', async (req, res) => {
  await apiFun.getWishlist(req, res);
})

router.post("/remove-wishlist/", async (req, res) => {
  try {
    await apiFun.removeItemFromWishlist(req, res);
  } catch (err) {
    console.error("Error removing item from wishlist:", err);
    return res.status(500).json({ message: "Internal server error" });
  }

});
router.post("/remove-item-from-cart", async (req, res) => {
  try {
    let cartAfteritemRemoval = await apiFun.removeItemFromCart(req, res);
  } catch (err) {
    console.error("Error removing item from wishlist:", err);
    return res.status(500).json({ message: "Internal server error" });
  }

});
router.post("/update-cartItem-qty", async (req, res) => {
  console.log(req.body);
  try {

    let updateCartQty = await apiFun.updateCartQty(req, res);
  } catch (err) {
    console.error("Error removing item from wishlist:", err);
    return res.status(500).json({ message: "Internal server error" });
  }

});
router.post("/update-cartItem-qty-for-product-page", async (req, res) => {
  console.log(req.body);
  try {

    let updateCartQty = await apiFun.updateCartQtyForProductPage(req, res);
  } catch (err) {
    console.error("Error removing item from wishlist:", err);
    return res.status(500).json({ message: "Internal server error" });
  }

});
router.post("/cart/add", async (req, res) => {
  try {
    await apiFun.addToCart(req, res);
  } catch (err) {
    console.error("Error Adding item into cart:", err);
    return res.status(500).json({ message: "Internal server error" });
  }

});

router.post("/get-cart", async (req, res) => {
  try {
    let cartArray = await apiFun.getCartArray(req, res);
    let getStructuredCart = await apiFun.getStructuredCart(cartArray, req, res);
    res.status(200).json(getStructuredCart);
  } catch (err) {
    console.error("Error getting cart items :", err);
    return res.status(500).json({ message: "Internal server error" });
  }

});

router.post("/addItemToCartFromWishlist", async (req, res) => {
  try {
    await apiFun.addItemToCartFromWishlist(req, res);
  } catch (err) {
    console.error("Error Adding item into cart:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/addAlltoCartFromWishlist", async (req, res) => {
  try {
    await apiFun.addAlltoCartFromWishlist(req, res);
  } catch (err) {
    console.error("Error Adding item into cart:", err);
    return res.status(500).json({ message: "Internal server error" });
  }

});

router.post("/change-language", async (req, res) => {
  try {
    let setLang = await apiFun.setLang(req, res)

  } catch (err) {
    console.error("Error Adding item into cart:", err);
    return res.status(500).json({ message: "Internal server error" });
  }

});

router.post("/change-branch", async (req, res) => {
  try {
    let setBranch = await apiFun.setBranch(req, res)
    // return res.status(400).json({ message: "Invalid language provided" });
  } catch (err) {
    console.error("Error Adding item into cart:", err);
    return res.status(500).json({ message: "Internal server error" });
  }

});

router.post("/logOut", async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.status(200).json({ success: true, message: "Logged out successfully" });
    });
  } catch (err) {
    console.error("Error Adding item into cart:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }

});

router.post("/get-order-history", async (req, res) => {
  try {
    let orderHistory = await apiFun.getOrderHistory(req, res);
    // res.status(200).json(orderHistory);
  } catch (err) {
    console.error("Error getting order history:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
})




const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
router.post('/create-payment-intent', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2000, // Amount in cents
      currency: 'usd',

    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
