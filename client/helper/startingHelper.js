const mongoose = require("mongoose");

const Product = require("../model/productSchema");
const Category = require("../model/categorySchema");
const Brand = require("../model/brandSchema");
const User = require("../model/userSchema");
const Reviews = require("../model/reviewSchema");
const Store = require("../model/storeBranchSchema");
const Inventory = require("../model/inventorySchema");
const Charging = require("../model/chargingSchema");

const dummyData = require("../helper/dummyData");

const Admin = require("../model/adminSchema");

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubArray = (arr) => {
    const count = Math.floor(Math.random() * arr.length) + 1;
    return arr.sort(() => 0.5 - Math.random()).slice(0, count);
};

const startingFun = {
    createDummyData: async (req, res) => {
        try {
            // Cleanup existing data
            await Promise.all([
                Product.deleteMany({}),
                Category.deleteMany({}),
                Brand.deleteMany({}),
                Store.deleteMany({}),
                Inventory.deleteMany({}),
                User.deleteMany({}),
                Reviews.deleteMany({}),
                Admin.deleteMany({})
            ]);

            // Re-create the official admin user with the specific ID used in middleware
            await new Admin({
                _id: '695c8f151a5379a5e7cd4088',
                name: 'Admin',
                email: 'admin@igrab.com',
                role: 'superadmin'
            }).save();

            // Brands
            const brands = await Brand.insertMany(dummyData.brands);

            // Categories
            const categories = await Category.insertMany(dummyData.categories);

            // Store Branches
            const branches = await Store.insertMany(dummyData.storeBranches);
            const branchIds = branches.map(b => b._id);

            // Products
            const products = await Promise.all(
                dummyData.products.map(product => {
                    return Product.create({
                        ...product,
                        branchIds: getRandomSubArray(branchIds),
                        brandId: getRandomItem(brands)._id,
                        categoryId: getRandomItem(categories)._id
                    });
                })
            );

            // Inventory
            await Promise.all(products.flatMap(product =>
                product.branchIds.map(branchId =>
                    Inventory.create({
                        productId: product._id,
                        branchId,
                        stock: product.inStock
                    })
                )
            ));

            // Users
            const users = await User.insertMany(
                dummyData.users.map((u, i) => ({
                    ...u,
                    wishlist: [getRandomItem(products)._id],
                    cart: [
                        {
                            productId: getRandomItem(products)._id,
                            quantity: 2
                        }
                    ]
                }))
            );

            // Reviews
            await Promise.all(users.map((user, i) =>
                Reviews.create({
                    user_Id: user._id,
                    product_Id: getRandomItem(products)._id,
                    profileImage: user.profile_image,
                    name: `${user.firstName} ${user.lastName}`,
                    ...dummyData.reviews[i % dummyData.reviews.length]
                })
            ));

            return res.status(201).json({ message: "Dummy data created successfully." });

        } catch (err) {
            console.error("Error creating dummy data:", err);
            return res.status(500).json({ error: "An error occurred while creating dummy data." });
        }
    },
    createDummyCharges: async (req, res) => {
        try {
            const chargings = [
                {
                    name: "Shipping Fee",
                    type: {
                        name: "percentage",
                        value: 10 // 10% of subtotal
                    }
                },
                {
                    name: "VAT",
                    type: {
                        name: "number",
                        value: 5 // flat AED 5
                    }
                },
                {
                    name: "Service Charge",
                    type: {
                        name: "percentage",
                        value: 2.5 // 2.5%
                    }
                }
            ];

            await Charging.deleteMany({});
            await Charging.insertMany(chargings);
            return res.status(200).json({ message: "Dummy charges created successfully." });
        } catch (err) {
            console.error("Error creating dummy charges:", err);
            return res.status(500).json({ error: "An error occurred while creating dummy charges." });
        }
    },
    createDummyOrder: async (req, res) => {
        try {
            const Order = require("../model/orderSchema");
            const user = await User.findOne({});
            const branch = await Store.findOne({});
            const products = await Product.find({ branchIds: branch._id }).limit(2);
            const chargingDocs = await Charging.find({});

            if (!user || !branch || products.length === 0) {
                return res.status(400).json({ error: "Required data (user, branch, or products) missing for order creation." });
            }

            const orderItems = products.map(p => ({
                productId: p._id,
                name: p.name.en,
                image: p.images[0] || null,
                qty: 1,
                unitPrice: p.pricing.price,
                total: p.pricing.price
            }));

            const subTotal = orderItems.reduce((sum, item) => sum + item.total, 0);
            const charges = chargingDocs.map(charge => {
                let price = 0;
                if (charge.type.name === "percentage") {
                    price = (subTotal * charge.type.value) / 100;
                } else if (charge.type.name === "number") {
                    price = charge.type.value;
                }
                return { name: charge.name, amount: Math.round(price * 100) / 100 };
            });

            const totalAmount = charges.reduce((acc, c) => acc + c.amount, subTotal);

            const orderData = {
                orderId: `DUMMY-${Date.now().toString().slice(-6)}`,
                storeId: branch._id,
                userId: user._id,
                status: 'Placed',
                paymentStatus: 'Unpaid',
                paymentMethod: 'Cash',
                subTotal,
                charges,
                totalAmount: Math.ceil(totalAmount * 100) / 100,
                orderItems,
                address: {
                    fullName: `${user.firstName} ${user.lastName}`,
                    phone: user.phone || "+971501234567",
                    area: "Downtown Dubai",
                    city: "Dubai",
                    address: "Emaar Square, Tower 1",
                    coordinates: {
                        type: 'Point',
                        coordinates: [55.2744, 25.1972]
                    }
                }
            };

            const savedOrder = await Order.create(orderData);
            return res.status(201).json({ message: "Dummy order created successfully.", order: savedOrder });
        } catch (err) {
            console.error("Error creating dummy order:", err);
            return res.status(500).json({ error: "An error occurred while creating dummy order." });
        }
    }
};

module.exports = startingFun;
