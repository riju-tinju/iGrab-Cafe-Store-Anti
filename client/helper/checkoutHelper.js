const mongoose = require("mongoose");
const Product = require("../model/productSchema");
const Category = require("../model/categorySchema");
const Brand = require("../model/brandSchema");
const User = require("../model/userSchema");
const Reviews = require("../model/reviewSchema");
const Store = require("../model/storeBranchSchema");
const Inventory = require("../model/inventorySchema");
const Charging = require("../model/chargingSchema");
const Order = require("../model/orderSchema")
const Payment = require("../model/paymentSchema")


const checkoutFun = {
  getCheckoutData: async (req, res) => {
    try {
      let checkoutData = {
        items: [],
        subTotal: 0,
        charges: [],
      }
      const storeId = res.locals.customer.selectedBranch;
      // req.session.user._id= '68446dbccfb2bcb333737e7a'
      if (!storeId) { return res.status(400).json({ error: "Store ID is required" }); }

      // Ensure user is logged in
      const user = await User.findById(req.session.user.id);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      let cart = user.cart;
      if (!cart || cart.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      const productIds = cart.map(item => item.productId);
      const products = await Product.find({
        _id: { $in: productIds },
        branchIds: storeId
      });

      const updatedCart = [];
      const checkoutItems = [];

      for (let cartItem of cart) {
        const product = products.find(p => p._id.equals(cartItem.productId));
        if (!product) continue;

        const inventory = await Inventory.findOne({
          productId: cartItem.productId,
          branchId: storeId
        });

        let availableStock = inventory ? inventory.stock : 0;
        let desiredQty = cartItem.quantity;
        let actualQty = desiredQty;
        let status = true;

        if (availableStock < desiredQty) {
          if (availableStock > 0) {
            actualQty = availableStock;
            status = true;

            // Update cart quantity to available stock
            updatedCart.push({
              productId: cartItem.productId,
              quantity: actualQty
            });
          } else {
            // No stock at all, keep cart as is with status false
            actualQty = desiredQty;
            status = false;

            updatedCart.push({
              productId: cartItem.productId,
              quantity: desiredQty
            });
          }
        } else {
          // Enough stock, no changes needed
          updatedCart.push({
            productId: cartItem.productId,
            quantity: actualQty
          });
        }

        checkoutItems.push({
          productName: product.name.en,
          qty: actualQty,
          unitPrice: product.pricing.price,
          total: actualQty * product.pricing.price,
          image: product.images[0] || null,
          status
        });
      }

      // Update cart in database
      user.cart = updatedCart;
      await user.save();
      console.log("checkoutItems", checkoutItems);
      checkoutData.items = checkoutItems;
      checkoutData.subTotal = checkoutItems.reduce((sum, item) => sum + item.total, 0);

      console.log("checkoutData", checkoutData);

      // 🧮 Charges
      const chargingDocs = await Charging.find({});
      const charges = chargingDocs.map(charge => {
        let price = 0;
        if (charge.type.name === "percentage") {
          price = (checkoutData.subTotal * charge.type.value) / 100;
        } else if (charge.type.name === "number") {
          price = charge.type.value;
        }
        return {
          chargingName: charge.name,
          price: Math.round(price * 100) / 100 // rounded to 2 decimals
        };
      });

      checkoutData.charges = charges;
      // ➕ Calculate totalAmount
      const totalAmount = charges.reduce((acc, item) => acc + item.price, checkoutData.subTotal);
      checkoutData.totalAmount = Math.ceil(totalAmount * 100) / 100; // rounded to 2 decimals
      console.log(checkoutData)

      let paymentSettings = {
        stripe: {
          isEnabled: false
        },
        cod: {
          isEnabled: true
        }
      }
      let paymentDataForSetting = await Payment.findOne({})
      if (paymentDataForSetting) {
        paymentSettings = paymentDataForSetting
        paymentSettings.stripe.secretKey = null
      }
      res.locals.paymentSettings = paymentSettings;
      console.log(paymentSettings)
      return res.status(200).render("pages/checkout/checkout", { checkoutData });
    } catch (err) {
      console.error("Error in getCheckoutData:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
  getDataForCheckout: async (req, res) => {
    try {
      let checkoutData = {
        items: [],
        subTotal: 0,
        charges: [],
      }
      const storeId = res.locals.customer.selectedBranch;
      // req.session.user._id= '68446dbccfb2bcb333737e7a'
      if (!storeId) { return res.status(400).json({ error: "Store ID is required" }); }

      // Ensure user is logged in
      const user = await User.findById(req.session.user.id);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      let cart = user.cart;
      if (!cart || cart.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      const productIds = cart.map(item => item.productId);
      const products = await Product.find({
        _id: { $in: productIds },
        branchIds: storeId
      });

      const updatedCart = [];
      const checkoutItems = [];

      for (let cartItem of cart) {
        const product = products.find(p => p._id.equals(cartItem.productId));
        if (!product) continue;

        const inventory = await Inventory.findOne({
          productId: cartItem.productId,
          branchId: storeId
        });

        let availableStock = inventory ? inventory.stock : 0;
        let desiredQty = cartItem.quantity;
        let actualQty = desiredQty;
        let status = true;

        if (availableStock < desiredQty) {
          if (availableStock > 0) {
            actualQty = availableStock;
            status = true;

            // Update cart quantity to available stock
            updatedCart.push({
              productId: cartItem.productId,
              quantity: actualQty
            });
          } else {
            // No stock at all, keep cart as is with status false
            actualQty = desiredQty;
            status = false;

            updatedCart.push({
              productId: cartItem.productId,
              quantity: desiredQty
            });
          }
        } else {
          // Enough stock, no changes needed
          updatedCart.push({
            productId: cartItem.productId,
            quantity: actualQty
          });
        }

        checkoutItems.push({
          productId: product._id,
          productName: product.name.en,
          qty: actualQty,
          unitPrice: product.pricing.price,
          total: actualQty * product.pricing.price,
          image: product.images[0] || null,
          status
        });
      }

      // Update cart in database
      user.cart = updatedCart;
      await user.save();
      console.log("checkoutItems", checkoutItems);
      checkoutData.items = checkoutItems;
      checkoutData.subTotal = checkoutItems.reduce((sum, item) => sum + item.total, 0);

      console.log("checkoutData", checkoutData);

      // 🧮 Charges
      const chargingDocs = await Charging.find({});
      const charges = chargingDocs.map(charge => {
        let price = 0;
        if (charge.type.name === "percentage") {
          price = (checkoutData.subTotal * charge.type.value) / 100;
        } else if (charge.type.name === "number") {
          price = charge.type.value;
        }
        return {
          chargingName: charge.name,
          price: Math.round(price * 100) / 100 // rounded to 2 decimals
        };
      });

      checkoutData.charges = charges;
      // ➕ Calculate totalAmount
      const totalAmount = charges.reduce((acc, item) => acc + item.price, checkoutData.subTotal);
      checkoutData.totalAmount = Math.ceil(totalAmount * 100) / 100; // rounded to 2 decimals
      console.log(checkoutData)
      if (!checkoutData.items || checkoutData.items.length === 0) {
        return res.status(400).json({ error: "No items available for checkout" });
      }
      checkoutData.userId = '68446dbccfb2bcb333737e7a';
      checkoutData.storeId = storeId;
      return checkoutData;
    } catch (err) {
      console.error("Error in getCheckoutData:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
  makeOrder: async (checkoutData, req, res) => {
    try {
      const Order = require("../model/orderSchema");
      const {
        items,
        subTotal,
        charges,
        totalAmount,
        userId,
        storeId,
        addressInputs,
      } = checkoutData;

      // Generate a unique order ID (example logic)
      const generateOrderId = () => `ORD${Date.now().toString().slice(-6)}UAE`;

      const orderData = {
        orderId: generateOrderId(),
        storeId: storeId,
        userId: userId,
        orderDate: new Date(),
        status:
          addressInputs.paymentMethod === "COD" ? "Placed" : "Pending",
        paymentStatus: 'Unpaid',
        paymentMethod:
          addressInputs.paymentMethod === "COD" ? "Cash" : "Online",
        subTotal: subTotal,
        charges: charges.map((c) => ({ name: c.chargingName, amount: c.price })),
        totalAmount: totalAmount,
        discount: 0, // If applicable
        couponCode: null, // If applicable
        orderItems: items.map((item) => ({
          productId: item.productId,
          name: item.productName,
          image: item.image,
          qty: item.qty,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        address: {
          fullName: addressInputs.fullName,
          phone: addressInputs.phone,
          building: "", // optional
          flat: "", // optional
          street: "", // optional
          area: addressInputs.city || "", // if area is part of city
          city: addressInputs.city,
          landmark: "", // optional
          address: addressInputs.address || "",
        },
        createdBy: null,
        assignedTo: null,
        updatedAt: new Date(),
      };

      const savedOrder = await Order.create(orderData);
      console.log("Order Created:", savedOrder);

      if (!savedOrder) {
        return res.status(500).json({ error: "Failed to create order" });
      }
      if (savedOrder.paymentMethod === "Cash") {
        return res.status(200).json({ status: "COD", data: savedOrder });
      }
      let paymentDataForSetting = await Payment.findOne({})
      const stripe = require('stripe')(paymentDataForSetting.stripe.secretKey);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: savedOrder.totalAmount * 100,  // 5 AED × 100 (converts to cents/fils), // in cents
        currency: 'aed',
        automatic_payment_methods: {
          enabled: true,
        },
        description: 'cafe items', // REQUIRED for Indian exports
        shipping: {  // Recommended for physical goods
          name: savedOrder.address.fullName,
          address: {
            line1: savedOrder.address.address || '',
            city: savedOrder.address.city || '',
            postal_code: '',
            country: 'AE', // Customer's country
          }
        },
        metadata: {
          orderId: savedOrder.orderId.toString(),
          totalAmount: savedOrder.totalAmount,
          paymentMethod: savedOrder.paymentMethod,
          export_type: 'service', // or 'goods'
          hsn_code: '998316' // For services (or SAC code)
        },
        // receipt_email: 'riju.tinju@gmail.com', // Optional, for sending receipt to customer
      });
      // console.log("Payment Intent Created:", paymentIntent);
      res.status(200).json({ status: "COO", data: paymentIntent });
    } catch (err) {
      console.error("Error in makeOrder:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

  },
  updateOrderStatusAfterPayment: async (paymentIntent) => {
    try {
      const orderId = paymentIntent.metadata.orderId;
      if (!orderId) {
        console.warn("⚠️ No orderId found in payment intent metadata");
        return;
      }

      const order = await Order.findOne({ orderId: orderId });
      if (!order) {
        console.warn(`⚠️ Order with ID ${orderId} not found`);
        return;
      }

      // 1. Update order statuses
      order.status = "Placed";
      order.paymentStatus = "Paid";
      order.updatedAt = new Date();
      await order.save();

      // 2. Update product and inventory
      for (const item of order.orderItems) {
        const product = await Product.findById(item.productId);
        if (!product) {
          console.warn(`⚠️ Product with ID ${item.productId} not found`);
          continue;
        }

        // 2a. Update Product stock & sales
        product.inStock = Math.max(product.inStock - item.qty, 0);
        product.sales.totalUnitsSold += item.qty;
        product.sales.totalRevenue += item.total;
        product.sales.totalOrders += 1;
        product.sales.lastSoldAt = new Date();
        await product.save();

        // 2b. Update Inventory for specific branch
        const inventory = await Inventory.findOne({
          productId: item.productId,
          branchId: order.storeId,
        });

        if (inventory) {
          inventory.stock = Math.max(inventory.stock - item.qty, 0);
          inventory.updatedAt = new Date();
          await inventory.save();
        } else {
          console.warn(`⚠️ Inventory record not found for product ${item.productId} at branch ${order.storeId}`);
        }
      }

      console.log(`✅ Order ${orderId} and inventory updated after payment`);

    } catch (err) {
      console.error("❌ Error updating order after payment:", err);
    }
  },

}
module.exports = checkoutFun;
