const mongoose = require("mongoose");
const Product = require("../model/productSchema");
const Category = require("../model/categorySchema");
const Brand = require("../model/brandSchema");
const Reviews = require("../model/reviewSchema");
const User = require("../model/userSchema");

const userFun = {
  getProduct: (req, res, productLimit, pageNumber) => {
    return new Promise(async (resolve, reject) => {
      console.log("+++++++ userFun.getProduct() with category join +++++++");

      try {
        const limit = parseInt(productLimit) || 2;
        const page = parseInt(pageNumber) || 1;
        const skip = (page - 1) * limit;

        const products = await Product.aggregate([
          {
            $match: {
              branchIds:
                res.locals.customer.selectedBranch || ''
            }
          },
          {
            $lookup: {
              from: "categories", // 👈 actual MongoDB collection name
              localField: "categoryId",
              foreignField: "_id",
              as: "category",
            },
          },
          {
            $unwind: {
              path: "$category",
              preserveNullAndEmptyArrays: true, // In case a category is missing
            },
          },
          {
            $project: {
              name: 1,
              description: 1,
              pricing: 1,
              images: 1,
              inStock: 1,
              meta: 1,
              sales: 1,
              status: 1,
              brandId: 1,
              createdAt: 1,
              updatedAt: 1,
              category: {
                name: "$category.name", // 👈 include category name object
              },
            },
          },
          { $skip: skip },
          { $limit: limit },
        ]);
        return resolve(products.length ? products : []);
      } catch (err) {
        console.log("getProduct error:\n", err);
        return resolve([]);
      }
    });
  },
  getCategory: (req, res) => {
    return new Promise(async (resolve, reject) => {
      console.log(
        "+++++++++++++++++++     userFun.getCategory()     +++++++++++++++++++++++++++"
      );
      try {
        let categories = await Category.find({});
        if (categories) return resolve(categories);
        return resolve([]);
      } catch (err) {
        console.error("getCategory error:\n", err);
        return resolve([]);
      }
    });
  },
  getBrand: (req, res, lang) => {
    return new Promise(async (resolve, reject) => {
      console.log("++++++++++++++ userFun.getBrand() ++++++++++++++");

      try {
        const validLang = ["en", "ar"];
        const selectedLang = validLang.includes(lang) ? lang : "en";

        const brands = await Brand.aggregate([
          {
            $project: {
              id: "$_id",
              image: "$logo",
              name: `$name.${selectedLang}`,
            },
          },
        ]);

        if (brands && brands.length > 0) {
          return resolve(brands);
        } else {
          return resolve([]);
        }
      } catch (err) {
        console.error("getBrand error:\n", err);
        return resolve([]);
      }
    });
  },
  getProductByFilter: (req, res) => {
    return new Promise(async (resolve, reject) => {
      console.log("+++++++++ userFun.getFilteredProducts() +++++++++");

      try {
        const {
          brand = "NOTHING",
          sort = "NOTHING",
          search = "NOTHING",
          category = "All",
          page = 1,
          limit = process.env.PRODUCT_LIMIT || 10,
          lang = "en",
        } = req.body;

        const query = {};
        const language = ["en", "ar"].includes(lang) ? lang : "en";

        if (brand !== "NOTHING") {
          const brandDoc = await Brand.findOne({ [`name.${language}`]: brand });
          if (brandDoc) {
            query.brandId = brandDoc._id;
          } else {
            return resolve([]);
          }
        }

        if (category !== "All" && category !== "Best_Selling") {
          const categoryDoc = await Category.findOne({
            [`name.${language}`]: category,
          });
          if (categoryDoc) {
            query.categoryId = categoryDoc._id;
          } else {
            return resolve([]);
          }
        }

        if (search !== "NOTHING") {
          query.$or = [
            { [`name.${language}`]: { $regex: search, $options: "i" } },
          ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const productLimit = parseInt(limit);

        const sortOptions = {
          new: { createdAt: -1 },
          "price-high": { "pricing.price": -1 },
          "price-low": { "pricing.price": 1 },
          "name-az": { [`name.${language}`]: 1 },
          "name-za": { [`name.${language}`]: -1 },
          Best_Selling: { "sales.totalOrders": -1 },
        };

        let sortBy = {};
        if (sortOptions[sort]) {
          sortBy = sortOptions[sort];
        } else if (category === "Best_Selling") {
          sortBy = sortOptions.Best_Selling;
        }

        const pipeline = [
          {
            $match: {
              branchIds:
                res.locals.customer.selectedBranch || ''
            }
          },
          { $match: query },
          {
            $lookup: {
              from: "categories",
              localField: "categoryId",
              foreignField: "_id",
              as: "category",
            },
          },
          {
            $lookup: {
              from: "brands",
              localField: "brandId",
              foreignField: "_id",
              as: "brand",
            },
          },
          { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              name: 1,
              description: 1,
              pricing: 1,
              images: 1,
              inStock: 1,
              sales: 1,
              status: 1,
              meta: 1,
              createdAt: 1,
              updatedAt: 1,
              category: { name: `$category.name.${language}` },
              brand: {
                id: "$brand._id",
                name: `$brand.name.${language}`,
                image: "$brand.logo",
              },
            },
          },
        ];

        if (Object.keys(sortBy).length > 0) {
          pipeline.push({ $sort: sortBy });
        }

        pipeline.push({ $skip: skip }, { $limit: productLimit });

        const products = await Product.aggregate(pipeline);
        return resolve(products);
      } catch (err) {
        console.error("❌ getFilteredProducts Error:", err);
        return resolve([]);
      }
    });
  },
  getProductByURL: (req, res) => {
    return new Promise(async (resolve, reject) => {
      console.log("+++++++++ userFun.getProductByName() +++++++++");

      try {
        const productURL = req.params.url;
        if (!productURL) {
          return resolve(null);
        }

        const query = {};
        query[`meta.slug`] = productURL;
        const product = await Product.findOne(query);

        if (!product) {
          return resolve(null);
        }

        return resolve(product.toObject());
      } catch (err) {
        console.error("getProductByURL error:", err);
        return resolve(null);
      }
    });
  },
  getCategoryByProductId: (req, res, categoryId) => {
    return new Promise(async (resolve, reject) => {
      console.log("+++++++++ userFun.getCategoryByProductId() +++++++++");
      try {
        if (!categoryId) return resolve(null);
        const category = await Category.findOne({ _id: categoryId });
        return resolve(category);
      } catch (err) {
        console.log("getCategoryByProductId error:\n", err);
        return resolve(null);
      }
    });
  },
  getBrandById: (req, res, brandId) => {
    return new Promise(async (resolve, reject) => {
      console.log("+++++++++ userFun.getBrandByBrandId() +++++++++");
      try {
        if (!brandId) return resolve(null);
        const brand = await Brand.findOne({ _id: brandId });
        return resolve(brand);
      } catch (err) {
        console.log("getBrandByBrandId error:\n", err);
        return resolve(null);
      }
    });
  },
  getProductReviews: (req, res, productId) => {
    return new Promise(async (resolve, reject) => {
      console.log("+++++++++ userFun.getProductReviews() +++++++++");
      try {
        if (!productId) return resolve([]);
        const reviews = await Reviews.find({
          product_Id: productId,
          hidden: false,
        }).sort({ createdAt: -1 });

        return resolve(reviews.map(review => review.toObject()));
      } catch (err) {
        console.log("getProductReviews error:\n", err);
        return resolve([]);
      }
    });
  },
  isProductWishlisted: (req, res, productId) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!productId) return resolve(false);

        if (res.locals.customer.user === "user") {
          const userId = req.session.user?.id;
          if (!userId) return resolve(false);

          const user = await User.findById(userId).select("wishlist");
          if (!user || !user.wishlist) return resolve(false);

          const isWishlisted = user.wishlist.includes(productId.toString());
          return resolve(isWishlisted);
        }

        if (res.locals.customer.user === "guest") {
          const guestWishlist = res.locals.customer.wishlist || [];
          const isWishlisted = guestWishlist.includes(productId.toString());
          return resolve(isWishlisted);
        }

        return resolve(false);
      } catch (error) {
        console.error("Error checking wishlist status:", error);
        return resolve(false);
      }
    });
  },
  isProductInCart: async (req, res, productId) => {
    try {
      if (!productId) {
        return { inCart: false, qty: 0, total: 0 };
      }

      let cart = [];

      if (res.locals.customer.user === "user") {
        const user = await User.findById(req.session.user?.id).select("cart");
        if (!user || !user.cart) {
          return { inCart: false, qty: 0, total: 0 };
        }
        cart = user.cart;
      }

      else if (res.locals.customer.user === "guest") {
        cart = req.session.cart || [];
      }

      const cartItem = cart.find(
        (item) => item.productId?.toString() === productId.toString()
      );

      if (!cartItem) {
        return { inCart: false, qty: 0, total: 0 };
      }

      const product = await Product.findById(productId).select("pricing.price");
      const price = product?.pricing?.price || 0;
      const qty = cartItem.quantity || 0;
      const total = qty * price;

      return { inCart: true, qty, total };
    } catch (error) {
      console.error("Error checking if product is in cart:", error);
      return { inCart: false, qty: 0, total: 0 };
    }
  },
  getAllBrands: (req, res) => {
    return new Promise(async (resolve, reject) => {
      console.log("++++++++++++++ userFun.getAllBrands() ++++++++++++++");

      try {
        const brands = await Brand.find({});
        return resolve(brands || []);
      } catch (err) {
        console.error("getBrands error:\n", err);
        return resolve([]);
      }
    });
  },
};

module.exports = userFun;
