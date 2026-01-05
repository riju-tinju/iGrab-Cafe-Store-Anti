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

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubArray = (arr) => {
    const count = Math.floor(Math.random() * arr.length) + 1;
    return arr.sort(() => 0.5 - Math.random()).slice(0, count);
};

const startingFun = {
    createDummyData: async (req, res) => {
        try {
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
    }
};



module.exports = startingFun;
