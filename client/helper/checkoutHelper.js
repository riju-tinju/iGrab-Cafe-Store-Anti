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
const DeliveryCharge = require("../model/deliveryChargeSchema");


const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const checkoutFun = {
  getCheckoutData: async (req, res) => {
    try {
      let checkoutData = {
        items: [],
        subTotal: 0,
        charges: [],
      }
      const storeId = res.locals.customer.selectedBranch;
      // req.session.user._id reference removed
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
      checkoutData.storeId = storeId;
      return res.status(200).render("pages/checkout/checkout", { checkoutData, googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY });
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
      // req.session.user._id reference removed
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
      checkoutData.userId = req.session.user.id;
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

      // 1. Final Stock Check
      for (const item of items) {
        const inventory = await Inventory.findOne({
          productId: item.productId,
          branchId: storeId
        });

        if (!inventory || inventory.stock < item.qty) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${item.productName}. Please adjust your cart.`
          });
        }
      }

      const deliveryCharge = parseFloat(addressInputs.deliveryCharge) || 0;

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
        charges: [
          ...charges.map((c) => ({ name: c.chargingName, amount: c.price })),
          { name: "Delivery Charge", amount: deliveryCharge }
        ],
        totalAmount: totalAmount + deliveryCharge,
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
          coordinates: {
            type: 'Point',
            coordinates: [
              parseFloat(addressInputs.longitude) || 0,
              parseFloat(addressInputs.latitude) || 0
            ]
          }
        },
        deliveryExecutive: {
          assigned: false,
          deliveryCharge: deliveryCharge,
        },
        createdBy: null,
        assignedTo: null,
        updatedAt: new Date(),
      };

      const savedOrder = await Order.create(orderData);

      if (!savedOrder) {
        throw new Error("Failed to create order record in database");
      }

      console.log("Order Created:", savedOrder.orderId);

      // 3. Deduct Stock (ONLY FOR COD)
      // For Online payment, stock is deducted after successful payment confirmation (webhook)
      if (savedOrder.paymentMethod === "Cash") {
        for (const item of items) {
          await Inventory.findOneAndUpdate(
            { productId: item.productId, branchId: storeId },
            { $inc: { stock: -item.qty } }
          );
        }
      }

      if (savedOrder.paymentMethod === "Cash") {
        return res.status(200).json({ status: "COD", data: savedOrder });
      }
      let paymentDataForSetting = await Payment.findOne({})
      const stripe = require('stripe')(paymentDataForSetting.stripe.secretKey);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(savedOrder.totalAmount * 100),  // Convert to fils and ensure integer
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
      return res.status(500).json({
        success: false,
        message: err.message || "An unexpected error occurred while processing your order. Please try again."
      });
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

      // 0. Check if order is already paid (idempotency)
      if (order.paymentStatus === "Paid") {
        console.log(`ℹ️ Order ${orderId} is already marked as Paid. Skipping update.`);
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
        // Ensure inStock is a valid number (handle undefined/null cases)
        const currentStock = typeof product.inStock === 'number' ? product.inStock : 0;
        product.inStock = Math.max(currentStock - item.qty, 0);

        // Ensure sales object exists
        if (!product.sales) {
          product.sales = {
            totalUnitsSold: 0,
            totalRevenue: 0,
            totalOrders: 0,
            lastSoldAt: null
          };
        }

        product.sales.totalUnitsSold = (product.sales.totalUnitsSold || 0) + item.qty;
        product.sales.totalRevenue = (product.sales.totalRevenue || 0) + item.total;
        product.sales.totalOrders = (product.sales.totalOrders || 0) + 1;
        product.sales.lastSoldAt = new Date();
        await product.save();

        // 2b. Update Inventory for specific branch
        const inventory = await Inventory.findOne({
          productId: item.productId,
          branchId: order.storeId,
        });

        if (inventory) {
          const currentInventoryStock = typeof inventory.stock === 'number' ? inventory.stock : 0;
          inventory.stock = Math.max(currentInventoryStock - item.qty, 0);
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

  getDeliveryCharge: async (req, res) => {
    try {
      const { latitude, longitude, emirate, branchId } = req.query;

      // 1. Strict Parameter Validation
      if (!latitude || !longitude || !branchId) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameters (latitude, longitude, branchId)"
        });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: "Invalid coordinates provided"
        });
      }

      // 2. Branch Existence and Location Check
      let branch;
      try {
        branch = await Store.findById(branchId);
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid Branch ID" });
      }

      if (!branch) {
        return res.status(404).json({ success: false, message: "Branch not found" });
      }

      if (!branch.location || !branch.location.coordinates || branch.location.coordinates.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Store branch does not have valid location coordinates set. Please contact support."
        });
      }

      const distance = calculateDistance(
        lat,
        lng,
        branch.location.coordinates[1],
        branch.location.coordinates[0]
      );

      // 3. Delivery Charge Configuration Lookup
      // Use case-insensitive search or exact match depending on how emirates are saved
      const chargeConfig = await DeliveryCharge.findOne({
        emirate: { $regex: new RegExp(`^${emirate}$`, 'i') },
        isActive: true
      });

      if (!chargeConfig) {
        return res.status(400).json({
          success: false,
          message: `Delivery is not currently available in ${emirate || 'your area'}. Please select a location within an approved Emirate.`
        });
      }

      // 4. Calculation based on Config
      let chargeAmount = 0;
      if (chargeConfig.chargeType === 'fixed') {
        chargeAmount = chargeConfig.fixedCharge;
      } else {
        const { baseDistance, baseCost, extraCostPerKm } = chargeConfig.distanceCharge;
        if (distance <= baseDistance) {
          chargeAmount = baseCost;
        } else {
          // Linear calculation for extra distance
          chargeAmount = baseCost + ((distance - baseDistance) * extraCostPerKm);
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          deliveryCharge: Math.round(chargeAmount * 100) / 100,
          distance: distance.toFixed(2),
          emirate: chargeConfig.emirate,
          chargeType: chargeConfig.chargeType
        }
      });

    } catch (err) {
      console.error("Error in getDeliveryCharge:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error calculating delivery charge"
      });
    }
  },

  getAllowedEmirates: async (req, res) => {
    try {
      const allowedEmirates = await DeliveryCharge.find({ isActive: true }).distinct('emirate');
      return res.status(200).json({
        success: true,
        data: allowedEmirates
      });
    } catch (err) {
      console.error("Error in getAllowedEmirates:", err);
      return res.status(500).json({ success: false, message: "Internal server error fetching allowed Emirates" });
    }
  }

}
module.exports = checkoutFun;
