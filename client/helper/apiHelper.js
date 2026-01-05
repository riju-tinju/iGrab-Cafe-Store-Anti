const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Product = require("../model/productSchema");
const Category = require("../model/categorySchema");
const Brand = require("../model/brandSchema");
const User = require("../model/userSchema");
const Reviews = require("../model/reviewSchema");
const Inventory = require("../model/inventorySchema");
const Charges = require("../model/chargingSchema");
const Store = require("../model/storeBranchSchema");
const Order = require("../model/orderSchema");

const apiFun = {
    wishlistAction: async (req, res) => {
        console.log("Wishlist action initiated");
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ error: "Product ID is required" });
        }

        const handleWishlist = async () => {
            try {
                const product = await Product.findById(productId);
                if (!product) {
                    return res.status(404).json({ error: "Product not found" });
                }

                // Guest user handling
                if (!req.session.user?.id) {
                    console.log("Guest user wishlist action");
                    if (!req.session.wishlist) {
                        console.log("Initializing wishlist for guest user");
                        req.session.wishlist = [productId];
                        return res.status(200).json({ status: "ADDED", message: "Product added to wishlist" });
                    }

                    const index = req.session.wishlist.indexOf(productId);
                    if (index > -1) {
                        req.session.wishlist.splice(index, 1);
                        return res.status(200).json({ status: "REMOVED", message: "Product removed from wishlist" });
                    } else {
                        req.session.wishlist.push(productId);
                        return res.status(200).json({ status: "ADDED", message: "Product added to wishlist" });
                    }
                }

                // Logged-in user handling
                const userId = req.session.user.id;
                const user = await User.findById(userId);
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }

                if (!user.wishlist) {
                    user.wishlist = [productId];
                    await user.save();
                    return res.status(200).json({ status: "ADDED", message: "Product added to wishlist" });
                } else {
                    const index = user.wishlist.indexOf(productId);
                    if (index > -1) {
                        user.wishlist.splice(index, 1);
                        await user.save();
                        return res.status(200).json({ status: "REMOVED", message: "Product removed from wishlist" });
                    } else {
                        user.wishlist.push(productId);
                        await user.save();
                        return res.status(200).json({ status: "ADDED", message: "Product added to wishlist" });
                    }
                }


                return res.status(500).json({ error: "Internal server error" });

            } catch (error) {
                console.error("Wishlist error:", error);
                return res.status(500).json({ error: "Internal server error" });
            }
        };

        await handleWishlist();
    },
    getWishlist: async (req, res) => {
        try {
            console.log("Fetching wishlist");

            // ====== LOGGED-IN USER ======
            if (res.locals.customer.user === 'user') {
                let user = await User.findById(req.session.user?.id).populate({
                    path: 'wishlist',
                    select: 'name description pricing.currency pricing.price images inStock status.isAvailable categoryId',
                    populate: {
                        path: 'categoryId',
                        select: 'name.en -_id' // Only get English name
                    }
                });

                if (!user) return res.status(404).json({ error: "User not found" });

                if (!user.wishlist || user.wishlist.length === 0) {
                    return res.status(200).json([]);
                }

                // Format the response
                const formattedWishlist = user.wishlist.map(product => ({
                    id: product._id,
                    name: product.name.en,
                    nameAr: product.name.ar || product.name.en, // Fallback to English if Arabic not available
                    category: product.categoryId?.name.en || "Uncategorized",
                    categoryAr: product.categoryId?.name.ar || "غير مصنف",
                    price: product.pricing.price,
                    isAvailable: product.inStock > 0,
                    image: product.images[0] || "default-product-image-url" // Fallback if no image
                }));

                return res.status(200).json(formattedWishlist);
            }

            // ====== GUEST USER ======
            if (!res.locals.customer.wishlist || res.locals.customer.wishlist.length === 0) {
                return res.status(200).json([]);
            }

            // Fetch guest wishlist products
            const guestWishlistProducts = await Product.find({
                _id: { $in: res.locals.customer.wishlist }
            }).select('name.en pricing.price images inStock status.isAvailable categoryId')
                .populate('categoryId', 'name.en -_id');

            // Format guest wishlist
            const formattedGuestWishlist = guestWishlistProducts.map(product => ({
                id: product._id,
                name: product.name.en,
                nameAr: product.name.ar || product.name.en, // Fallback to English if Arabic not available
                category: product.categoryId?.name.en || "Uncategorized",
                categoryAr: product.categoryId?.name.ar || "غير مصنف",
                price: product.pricing.price,
                isAvailable: product.inStock > 0,
                image: product.images[0] || "default-product-image-url"
            }));
            console.log(formattedGuestWishlist)
            return res.status(200).json(formattedGuestWishlist);

        } catch (err) {
            console.error("Error fetching wishlist:", err);
            return res.status(500).json({ error: "An error occurred." });
        }
    },
    removeItemFromWishlist: async (req, res) => {
        try {
            const { productId } = req.body;

            if (!productId) {
                return res.status(400).json({ error: "Product ID is required" });
            }

            // Check if user is logged in
            if (res.locals.customer.user === 'user') {
                const user = await User.findById(req.session.user.id);
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }

                // Remove product from user's wishlist
                const index = user.wishlist.indexOf(productId);
                if (index > -1) {
                    user.wishlist.splice(index, 1);
                    await user.save();
                    return res.status(200).json({ status: "REMOVED", message: "Product removed from wishlist" });
                } else {
                    return res.status(404).json({ error: "Product not found in wishlist" });
                }
            }

            // Guest user handling
            if (res.locals.customer.user === 'guest') {
                if (!req.session.wishlist || !req.session.wishlist.includes(productId)) {
                    return res.status(404).json({ error: "Product not found in wishlist" });
                }
                const index = req.session.wishlist.indexOf(productId);
                req.session.wishlist.splice(index, 1);
                return res.status(200).json({ status: "REMOVED", message: "Product removed from wishlist" });
            }
            return res.status(400).json({ error: "Invalid user type" });

        } catch (err) {
            console.error("Error removing item from wishlist:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    },
    addToCart: async (req, res) => {
        try {
            const { productId } = req.body;

            if (!productId) {
                return res.status(400).json({ error: "Product ID is required" });
            }

            // Ensure the product exists
            const productExists = await Product.exists({ _id: productId });
            if (!productExists) {
                return res.status(404).json({ error: "Product not found" });
            }
            let product = await Product.findById(productId)
            console.log("available products", product.inStock)
            if (!product.inStock > 0) {
                return res.status(404).json({ ToastMessage: "Product Not Available Now" });
            }

            // Logged-in user
            if (res.locals.customer.user === "user") {
                const user = await User.findById(req.session.user.id);
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }

                const existingCartItem = user.cart.find(item => item.productId.toString() === productId);

                if (existingCartItem) {
                    // If item already in cart, increase quantity by 1
                    existingCartItem.quantity += 1;
                    existingCartItem.addedDate = new Date(); // update date
                } else {
                    // Add new item
                    user.cart.push({
                        productId,
                        quantity: 1,
                    });
                }

                await user.save();
                return res.status(200).json({ status: "ADDED", message: "Product added to cart" });
            }

            // Guest user
            if (res.locals.customer.user === "guest") {
                if (!req.session.cart) {
                    req.session.cart = [];
                }

                const index = req.session.cart.findIndex(item => item.productId === productId);

                if (index !== -1) {
                    // Product exists in guest cart, increment quantity
                    req.session.cart[index].quantity += 1;
                    req.session.cart[index].addedDate = new Date();
                } else {
                    // Add new product
                    req.session.cart.push({
                        productId,
                        quantity: 1,
                        addedDate: new Date(),
                    });
                }

                return res.status(200).json({ status: "ADDED", message: "Product added to cart" });
            }

            return res.status(400).json({ error: "Invalid user type" });

        } catch (err) {
            console.error("Error adding item to cart:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    },
    getCartArray: async (req, res) => {
        try {

            // Logged-in user
            if (res.locals.customer.user === "user") {
                const user = await User.findById(req.session.user.id);
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }

                let cart = user.cart || [];
                return cart
            }

            // Guest user
            if (res.locals.customer.user === "guest") {
                if (!req.session.cart) {
                    req.session.cart = [];
                }
                return req.session.cart || [];
            }

            return res.status(400).json({ error: "Invalid UserCart Error" });

        } catch (err) {
            console.error("Error adding item to cart:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    },
    getStructuredCart: async (cartArray, req, res) => {
        try {
            const structuredCart = [];
            const structuredCartwithFullDetails = {
                items: [],
                charges: [],
                subTotal: 0,
                totalAmount: 0,
            };

            const branchId = res.locals.customer.selectedBranch;

            if (!branchId) {
                return res.status(400).json({ error: "Branch not selected" });
            }

            // Step 1: Build Cart Items and Subtotal
            let subTotal = 0;

            for (const cartItem of cartArray) {
                const product = await Product.findById(cartItem.productId).populate("categoryId");
                if (!product) continue;

                const inventory = await Inventory.findOne({
                    productId: cartItem.productId,
                    branchId: branchId,
                });

                if (!inventory) continue;

                const stock = inventory.stock || 0;
                const price = product.pricing?.price || 0;
                const itemTotal = price * cartItem.quantity;

                structuredCart.push({
                    id: product._id,
                    name: product.name?.en || "Unnamed Product",
                    nameAr: product.name?.ar || product.name?.en || "Unnamed Product",
                    Category: product.categoryId?.name?.en || "Uncategorized",
                    CategoryAr: product.categoryId?.name?.ar || "غير مصنف",
                    price: price,
                    image: product.images?.[0] || "",
                    quantity: cartItem.quantity,
                    inStock: stock,
                });

                subTotal += itemTotal;
            }

            structuredCartwithFullDetails.items = structuredCart;
            structuredCartwithFullDetails.subTotal = parseFloat(subTotal.toFixed(2));

            // Step 2: Fetch Charges and Calculate Total Amount
            const charges = await Charges.find({});
            let totalAmount = subTotal;
            const chargeList = [];

            for (const charge of charges) {
                const { name, type } = charge;
                let amount = 0;

                if (type.name === "percentage") {
                    amount = (subTotal * type.value) / 100;
                } else if (type.name === "number") {
                    amount = type.value;
                }

                amount = parseFloat(amount.toFixed(2));
                chargeList.push({ name, amount });
                totalAmount += amount;
            }

            structuredCartwithFullDetails.charges = chargeList;
            structuredCartwithFullDetails.totalAmount = parseFloat(totalAmount.toFixed(2));
            console.log("Structured Cart with Full Details:", structuredCartwithFullDetails);
            return structuredCartwithFullDetails;
        } catch (err) {
            console.error("Error formatting structured cart:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    },

    addItemToCartFromWishlist: async (req, res) => {
        try {
            const productId = req.body.itemId;

            // Validate input
            if (!productId) {
                return res.status(400).json({
                    success: false,
                    errorCode: "MISSING_ID",
                    userMessage: "Product selection is required",
                    debug: "No product ID provided in request"
                });
            }

            // Check product exists
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    errorCode: "PRODUCT_NOT_FOUND",
                    userMessage: "This product is no longer available",
                    debug: `Product ${productId} not found`
                });
            }

            // Check stock
            if (product.inStock <= 0) {
                return res.status(409).json({
                    success: false,
                    errorCode: "STOCK_LOW",
                    userMessage: "This item is currently out of stock",
                    debug: `Inventory level: ${product.inStock} units`
                });
            }

            // Handle logged-in user
            if (res.locals.customer.user === "user") {
                const user = await User.findById(req.session.user.id);
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        errorCode: "USER_NOT_FOUND",
                        userMessage: "Please log in again",
                        debug: "User session exists but user not found in DB"
                    });
                }

                if (user.cart.some(item => item.productId.toString() === productId)) {
                    return res.status(409).json({
                        success: false,
                        errorCode: "ALREADY_IN_CART",
                        userMessage: "This item is already in your cart",
                        debug: `Product ${productId} already in user's cart`
                    });
                }

                user.cart.push({ productId, quantity: 1 });
                await user.save();

                return res.status(200).json({
                    success: true,
                    userMessage: "Item added to your cart!",
                    cartCount: user.cart.length
                });
            }

            // Handle guest user
            if (res.locals.customer.user === "guest") {
                req.session.cart = req.session.cart || [];

                if (req.session.cart.some(item => item.productId === productId)) {
                    return res.status(409).json({
                        success: false,
                        errorCode: "ALREADY_IN_CART",
                        userMessage: "This item is already in your cart",
                        debug: `Product ${productId} already in guest cart`
                    });
                }

                req.session.cart.push({
                    productId,
                    quantity: 1,
                    addedDate: new Date()
                });

                return res.status(200).json({
                    success: true,
                    userMessage: "Item added to your cart!",
                    cartCount: req.session.cart.length
                });
            }

            return res.status(400).json({
                success: false,
                errorCode: "INVALID_USER_TYPE",
                userMessage: "Unable to process your request",
                debug: `Unknown user type: ${res.locals.customer.user}`
            });

        } catch (err) {
            console.error("Error adding item to cart:", err);
            return res.status(500).json({
                success: false,
                errorCode: "SERVER_ERROR",
                userMessage: "We're having trouble processing your request",
                debug: err.message
            });
        }
    },
    removeItemFromCart: async (req, res) => {
        try {
            const { productId } = req.body;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    errorCode: "MISSING_ID",
                    userMessage: "Product ID is required to remove item",
                    debug: "No product ID provided"
                });
            }

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    errorCode: "PRODUCT_NOT_FOUND",
                    userMessage: "The product you're trying to remove no longer exists",
                    debug: `Product ${productId} not found`
                });
            }

            let cart = [];
            let totalCartCount = 0;

            // Logged-in user
            if (res.locals.customer.user === "user") {
                const user = await User.findById(req.session.user.id);
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        errorCode: "USER_NOT_FOUND",
                        userMessage: "Session expired, please log in again",
                        debug: "User session exists but user not found"
                    });
                }

                const originalLength = user.cart.length;
                user.cart = user.cart.filter(item => item.productId.toString() !== productId);

                if (user.cart.length === originalLength) {
                    return res.status(404).json({
                        success: false,
                        errorCode: "ITEM_NOT_FOUND_IN_CART",
                        userMessage: "Item not found in your cart",
                        debug: `Item ${productId} not in user's cart`
                    });
                }

                await user.save();
                cart = user.cart;
                totalCartCount = user.cart.length;

                // Guest user
            } else if (res.locals.customer.user === "guest") {
                req.session.cart = req.session.cart || [];
                const originalLength = req.session.cart.length;
                req.session.cart = req.session.cart.filter(item => item.productId !== productId);

                if (req.session.cart.length === originalLength) {
                    return res.status(404).json({
                        success: false,
                        errorCode: "ITEM_NOT_FOUND_IN_CART",
                        userMessage: "Item not found in your cart",
                        debug: `Item ${productId} not in guest cart`
                    });
                }

                cart = req.session.cart;
                totalCartCount = req.session.cart.length;

            } else {
                return res.status(400).json({
                    success: false,
                    errorCode: "INVALID_USER_TYPE",
                    userMessage: "Unable to process your request",
                    debug: `Unknown user type: ${res.locals.customer.user}`
                });
            }

            // ---------- Calculate Subtotal ----------
            let subTotal = 0;
            for (const item of cart) {
                const product = await Product.findById(item.productId);
                if (product) {
                    const price = product.pricing?.price || 0;
                    subTotal += price * item.quantity;
                }
            }

            // ---------- Get Charges and Apply ----------
            const allCharges = await Charges.find({});
            let totalCharge = 0;

            for (const charge of allCharges) {
                if (charge.type.name === "percentage") {
                    totalCharge += subTotal * (charge.type.value / 100);
                } else if (charge.type.name === "number") {
                    totalCharge += charge.type.value;
                }
            }

            const totalAmount = subTotal + totalCharge;

            // ---------- Final Response ----------
            return res.status(200).json({
                success: true,
                userMessage: "Item removed from your cart",
                cartCount: totalCartCount,
                subTotal,
                totalCharge,
                totalAmount
            });

        } catch (err) {
            console.error("Error removing item from cart:", err);
            return res.status(500).json({
                success: false,
                errorCode: "SERVER_ERROR",
                userMessage: "Something went wrong while removing the item",
                debug: err.message
            });
        }
    },
    updateCartQty: async (req, res) => {
        try {
            console.log(req.body);
            const { productId, action } = req.body;
            let isExitsTheItem = true;
            let cartItemQty = 0;
            const branchId = res.locals.customer.selectedBranch;

            if (!productId || !["PLUS", "MINUS"].includes(action)) {
                return res.status(400).json({
                    success: false,
                    errorCode: "INVALID_INPUT",
                    userMessage: "Invalid request: Product ID and action are required",
                    debug: "Missing or invalid productId/action"
                });
            }

            // Get inventory for stock checking
            const inventory = await Inventory.findOne({ productId, branchId });
            const availableStock = inventory?.stock || 0;

            let cart = [];
            let totalCartCount = 0;

            // Logged-in user
            if (res.locals.customer.user === "user") {
                const user = await User.findById(req.session.user.id);
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        errorCode: "USER_NOT_FOUND",
                        userMessage: "Please log in again",
                        debug: "User session exists but not found"
                    });
                }

                const cartItem = user.cart.find(item => item.productId.toString() === productId);
                if (!cartItem) {
                    return res.status(404).json({
                        success: false,
                        errorCode: "ITEM_NOT_FOUND_IN_CART",
                        userMessage: "Item not found in your cart",
                        debug: `Item ${productId} not in user's cart`
                    });
                }

                if (action === "PLUS") {
                    if (cartItem.quantity + 1 > availableStock) {
                        return res.status(400).json({
                            success: false,
                            errorCode: "OUT_OF_STOCK",
                            userMessage: `Only ${availableStock} items in stock`,
                            debug: "Trying to exceed available inventory"
                        });
                    }
                    cartItem.quantity += 1;
                    cartItemQty = cartItem.quantity;
                } else if (action === "MINUS") {
                    cartItem.quantity -= 1;
                    cartItemQty = cartItem.quantity;
                    if (cartItem.quantity <= 0) {
                        isExitsTheItem = false;
                        user.cart = user.cart.filter(item => item.productId.toString() !== productId);
                    }
                }

                await user.save();
                cart = user.cart;
                totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

                // Guest user
            } else if (res.locals.customer.user === "guest") {
                req.session.cart = req.session.cart || [];
                const cartItem = req.session.cart.find(item => item.productId === productId);

                if (!cartItem) {
                    return res.status(404).json({
                        success: false,
                        errorCode: "ITEM_NOT_FOUND_IN_CART",
                        userMessage: "Item not found in your cart",
                        debug: `Item ${productId} not in guest cart`
                    });
                }

                if (action === "PLUS") {
                    if (cartItem.quantity + 1 > availableStock) {
                        return res.status(400).json({
                            success: false,
                            errorCode: "OUT_OF_STOCK",
                            userMessage: `Only ${availableStock} items in stock`,
                            debug: "Trying to exceed available inventory"
                        });
                    }
                    cartItem.quantity += 1;
                    cartItemQty = cartItem.quantity;
                } else if (action === "MINUS") {
                    cartItem.quantity -= 1;
                    cartItemQty = cartItem.quantity;
                    if (cartItem.quantity <= 0) {
                        isExitsTheItem = false;
                        req.session.cart = req.session.cart.filter(item => item.productId !== productId);
                    }
                }

                cart = req.session.cart;
                totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

            } else {
                return res.status(400).json({
                    success: false,
                    errorCode: "INVALID_USER_TYPE",
                    userMessage: "Unable to process your request",
                    debug: `Unknown user type: ${res.locals.customer.user}`
                });
            }

            // ---------- Calculate Subtotal ----------
            let subTotal = 0;
            for (const item of cart) {
                const product = await Product.findById(item.productId);
                if (product) {
                    const price = product.pricing?.price || 0;
                    subTotal += price * item.quantity;
                }
            }

            // ---------- Apply Charges ----------
            const allCharges = await Charges.find({});
            let totalCharge = 0;

            for (const charge of allCharges) {
                if (charge.type.name === "percentage") {
                    totalCharge += subTotal * (charge.type.value / 100);
                } else if (charge.type.name === "number") {
                    totalCharge += charge.type.value;
                }
            }

            const totalAmount = subTotal + totalCharge;

            // ---------- Response ----------
            return res.status(200).json({
                success: true,
                userMessage: `Item ${action === "PLUS" ? "increased" : "decreased"} successfully`,
                cartCount: totalCartCount,
                subTotal,
                totalCharge,
                totalAmount,
                isExitsTheItem,
                cartItemQty,
            });

        } catch (err) {
            console.error("Error updating cart quantity:", err);
            return res.status(500).json({
                success: false,
                errorCode: "SERVER_ERROR",
                userMessage: "Something went wrong while updating the cart",
                debug: err.message
            });
        }
    },
    updateCartQtyForProductPage: async (req, res) => {
        try {

            const { productId, action } = req.body;
            let isExitsTheItem = true;
            let cartItemQty = 0;
            const branchId = res.locals.customer.selectedBranch;

            if (!productId || !["PLUS", "MINUS"].includes(action)) {
                return res.status(400).json({
                    success: false,
                    errorCode: "INVALID_INPUT",
                    userMessage: "Invalid request: Product ID and action are required",
                    debug: "Missing or invalid productId/action"
                });
            }

            // Get inventory for stock checking
            const inventory = await Inventory.findOne({ productId, branchId });
            const availableStock = inventory?.stock || 0;

            if (availableStock <= 0) {
                return res.status(400).json({
                    success: false,
                    errorCode: "OUT_OF_STOCK",
                    userMessage: `Item is out of stock in this branch`,
                    debug: "Inventory stock = 0"
                });
            }

            let cart = [];
            let totalCartCount = 0;

            // ------------- Logged-in User -------------
            if (res.locals.customer.user === "user") {
                const user = await User.findById(req.session.user.id);
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        errorCode: "USER_NOT_FOUND",
                        userMessage: "Please log in again",
                        debug: "User session exists but not found"
                    });
                }

                let cartItem = user.cart.find(item => item.productId.toString() === productId);

                if (!cartItem) {
                    // Add new item if not in cart
                    user.cart.push({ productId, quantity: 1 });
                    cartItemQty = 1;
                } else {
                    // Update existing item
                    if (action === "PLUS") {
                        if (cartItem.quantity + 1 > availableStock) {
                            return res.status(400).json({
                                success: false,
                                errorCode: "OUT_OF_STOCK",
                                userMessage: `Only ${availableStock} items in stock`,
                                debug: "Trying to exceed available inventory"
                            });
                        }
                        cartItem.quantity += 1;
                    } else if (action === "MINUS") {
                        cartItem.quantity -= 1;
                        if (cartItem.quantity <= 0) {
                            isExitsTheItem = false;
                            user.cart = user.cart.filter(item => item.productId.toString() !== productId);
                        }
                    }
                    cartItemQty = cartItem?.quantity || 0;
                }

                await user.save();
                cart = user.cart;
                totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
            }

            // ------------- Guest User -------------
            else if (res.locals.customer.user === "guest") {
                req.session.cart = req.session.cart || [];
                let cartItem = req.session.cart.find(item => item.productId === productId);

                if (!cartItem) {
                    // Add new item if not in cart
                    req.session.cart.push({ productId, quantity: 1 });
                    cartItemQty = 1;
                } else {
                    if (action === "PLUS") {
                        if (cartItem.quantity + 1 > availableStock) {
                            return res.status(400).json({
                                success: false,
                                errorCode: "OUT_OF_STOCK",
                                userMessage: `Only ${availableStock} items in stock`,
                                debug: "Trying to exceed available inventory"
                            });
                        }
                        cartItem.quantity += 1;
                    } else if (action === "MINUS") {
                        cartItem.quantity -= 1;
                        if (cartItem.quantity <= 0) {
                            isExitsTheItem = false;
                            req.session.cart = req.session.cart.filter(item => item.productId !== productId);
                        }
                    }
                    cartItemQty = cartItem?.quantity || 0;
                }

                cart = req.session.cart;
                totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
            }

            else {
                return res.status(400).json({
                    success: false,
                    errorCode: "INVALID_USER_TYPE",
                    userMessage: "Unable to process your request",
                    debug: `Unknown user type: ${res.locals.customer.user}`
                });
            }

            // ---------- Calculate Subtotal ----------
            let subTotal = 0;
            for (const item of cart) {
                const product = await Product.findById(item.productId);
                if (product) {
                    const price = product.pricing?.price || 0;
                    subTotal += price * item.quantity;
                }
            }

            // ---------- Apply Charges ----------
            const allCharges = await Charges.find({});
            let totalCharge = 0;

            for (const charge of allCharges) {
                if (charge.type.name === "percentage") {
                    totalCharge += subTotal * (charge.type.value / 100);
                } else if (charge.type.name === "number") {
                    totalCharge += charge.type.value;
                }
            }

            const totalAmount = subTotal + totalCharge;

            // ---------- Get Total Price for the Updated Product ----------
            let productTotal = 0;
            const product = await Product.findById(productId);
            if (product) {
                const price = product.pricing?.price || 0;
                productTotal = price * cartItemQty;
            }

            // ---------- Final Response ----------
            return res.status(200).json({
                success: true,
                userMessage: `Item ${action === "PLUS" ? "increased" : "decreased"} successfully`,
                cartCount: totalCartCount,
                subTotal,
                totalCharge,
                totalAmount,
                isExitsTheItem,
                cartItemQty,
                productTotal,
            });

        } catch (err) {
            console.error("Error updating cart quantity:", err);
            return res.status(500).json({
                success: false,
                errorCode: "SERVER_ERROR",
                userMessage: "Something went wrong while updating the cart",
                debug: err.message
            });
        }
    },
    addAlltoCartFromWishlist: async (req, res) => {
        try {
            // Handle logged-in user
            if (res.locals.customer.user === "user") {
                const user = await User.findById(req.session.user.id).populate('wishlist');
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        errorCode: "USER_NOT_FOUND",
                        userMessage: "Please log in again",
                        debug: "User session exists but user not found in DB"
                    });
                }

                // Prepare filtered wishlist
                const validProducts = [];
                const updatedWishlist = [];

                for (let product of user.wishlist) {
                    const alreadyInCart = user.cart.find(item => item.productId.toString() === product._id.toString());
                    if (alreadyInCart || product.inStock <= 0) {
                        // Keep in wishlist if already in cart or out of stock
                        updatedWishlist.push(product._id);
                        continue;
                    }

                    validProducts.push({
                        productId: product._id,
                        quantity: 1,
                        addedDate: new Date()
                    });
                }

                // Update cart and wishlist
                user.cart.push(...validProducts);
                // user.wishlist = updatedWishlist; // if want remove items of wishlist
                await user.save();

                return res.status(200).json({
                    success: true,
                    movedCount: validProducts.length,
                    userMessage: "Items added to cart successfully",
                });
            }

            // Handle guest user
            if (res.locals.customer.user === "guest") {
                req.session.cart = req.session.cart || [];
                req.session.wishlist = req.session.wishlist || [];

                const validProductIds = [];
                const updatedWishlist = [];

                for (let productId of req.session.wishlist) {
                    const product = await Product.findById(productId);
                    if (!product) continue;

                    const alreadyInCart = req.session.cart.find(item => item.productId === productId);
                    if (alreadyInCart || product.inStock <= 0) {
                        updatedWishlist.push(productId);
                        continue;
                    }

                    validProductIds.push({
                        productId: productId,
                        quantity: 1,
                        addedDate: new Date()
                    });
                }

                req.session.cart.push(...validProductIds);
                // req.session.wishlist = updatedWishlist; // if want remove items of wishlist

                return res.status(200).json({
                    success: true,
                    movedCount: validProductIds.length,
                    userMessage: "Items added to cart successfully",
                });
            }

            // Fallback if user type is unknown
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_USER_TYPE",
                userMessage: "Unable to process your request",
                debug: `Unknown user type: ${res.locals.customer.user}`
            });

        } catch (err) {
            console.error("Error adding all wishlist items to cart:", err);
            return res.status(500).json({
                success: false,
                errorCode: "SERVER_ERROR",
                userMessage: "We're having trouble processing your request",
                debug: err.message
            });
        }
    },
    setLang: async (req, res) => {
        let { language } = req.body;
        if (!language) {
            return res.status(400).json({ message: "Language not provided" });
        }
        if (language !== "en" && language !== "ar") {
            return res.status(400).json({ message: "Invalid language provided" });
        }
        if (req.session.user && req.session.user.id) {
            // If user is logged in, update the language in the database
            const user = await User.findById(req.session.user.id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            user.language = language;
            await user.save();
            return res.status(200).json({ message: "Language updated successfully" });
        }

        res.locals.customer.language = language;
        req.session.lang = language; // Save language in session
        return res.status(200).json({ message: "Language updated successfully" });
    },
    setBranch: async (req, res) => {
        let branchId = req.body._id;
        if (!branchId) {
            return res.status(400).json({ message: "Branch not provided" });
        }
        const branch = await Store.find({ _id: branchId })
        if (!branch || branch.length === 0) {
            return res.status(400).json({ message: "Invalid Branch provided" });
        }

        res.locals.customer.selectedBranch = branchId;
        req.session.selectedBranch = branchId;
        return res.status(200).json({ message: "branch updated successfully" });
    },
    getOrderHistory: async (req, res) => {
        try {

            if (!req.session.user || !req.session.user.id) {
                return res.status(401).json({ message: "User not authenticated" });
            }
            const userId = req.session.user.id || '';
            
            console.log("User ID from session:", userId);
            if (!userId) {
                return res.status(401).json({ message: "User not authenticated" });
            }

            const user = await User.findById(userId)
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            let queryUserId = userId; // Start with the provided userId

            // Check if userId needs to be converted to an ObjectId
            // This is a good practice to handle cases where userId might be a string
            // that needs to be treated as an ObjectId.
            // if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
            //     queryUserId = new mongoose.Types.ObjectId(userId);
            //     console.log("Converting userId to ObjectId:", userId);
            // }
            let isValid = ObjectId.isValid(queryUserId); // returns true or false
            if (!isValid) {
                console.log("\n\nInvalid userId format:", queryUserId);
            }else{
                console.log("\n\nValid userId format:", queryUserId);
            }
            // queryUserId= queryUserId.toString()
          
            const orders = await Order.find({ 'userId': queryUserId });
            console.log("\n\n\nOrders found:", orders)
            return res.status(200).json({ orders });
        } catch (err) {
            console.error("Error fetching order history:", err);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

}

module.exports = apiFun;
