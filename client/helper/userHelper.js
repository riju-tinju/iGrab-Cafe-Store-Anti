const mongoose = require("mongoose");
const Product = require("../model/productSchema");
const Category = require("../model/categorySchema");
const Brand = require("../model/brandSchema");
const Reviews = require("../model/reviewSchema");
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
        // console.log("products : ", products);
        return resolve(products.length ? products : []);
      } catch (err) {
        console.log("getProduct error:\n", err);
        return resolve(null);
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
        return resolve(
          res.status(404).json({ message: "No categories found" })
        );
      } catch (err) {
        return resolve(
          res.status(500).json({ message: "Internal server error" })
        );
      }
    });
  },
  getBrand: (req, res, lang) => {
    return new Promise(async (resolve, reject) => {
      console.log("++++++++++++++ userFun.getBrand() ++++++++++++++");

      try {
        // Validate language input
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
          return resolve(null);
        }
      } catch (err) {
        console.error("getBrand error:\n", err);
        return resolve(
          res.status(500).json({ message: "Internal server error" })
        );
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

        // console.log("🔎 Request Body:", req.body);

        const query = {};
        const language = ["en", "ar"].includes(lang) ? lang : "en";

        // === BRAND FILTER ===
        if (brand !== "NOTHING") {
          const brandDoc = await Brand.findOne({ [`name.${language}`]: brand });
          // console.log("🔍 Brand Match:", brandDoc);

          if (brandDoc) {
            query.brandId = brandDoc._id;
          } else {
            // console.log("⚠️ No brand found matching:", brand);
            return resolve([]);
          }
        }

        // === CATEGORY FILTER ===
        if (category !== "All" && category !== "Best_Selling") {
          const categoryDoc = await Category.findOne({
            [`name.${language}`]: category,
          });
          // console.log("📦 Category Match:", categoryDoc);

          if (categoryDoc) {
            query.categoryId = categoryDoc._id;
          } else {
            // console.log("⚠️ No category found matching:", category);
            return resolve([]);
          }
        }

        // === SEARCH FILTER ===
        if (search !== "NOTHING") {
          query.$or = [
            { [`name.${language}`]: { $regex: search, $options: "i" } },
          ];
          // console.log("🔍 Search Query Added:", query.$or);
        }

        // === PAGINATION ===
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const productLimit = parseInt(limit);

        // === SORTING ===
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
          // console.log("🧭 Sort Applied from Sort Field:", sort);
        } else if (category === "Best_Selling") {
          sortBy = sortOptions.Best_Selling;
          // console.log("🧭 Sort Applied for Best_Selling Category");
        } else {
          // console.log("ℹ️ No Sort Applied");
        }

        // === AGGREGATION PIPELINE ===
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

        // console.log(
        //   "🧪 Final Aggregation Pipeline:",
        //   JSON.stringify(pipeline, null, 2)
        // );

        // === EXECUTE AGGREGATION ===
        const products = await Product.aggregate(pipeline);
        console.log("✅ Final Products:", products);

        return resolve(products);
      } catch (err) {
        console.error("❌ getFilteredProducts Error:", err);
        res
          .status(500)
          .json({ message: "Internal server error", error: err.message });
      }
    });
  },
  getProductByURL: (req, res) => {
    return new Promise(async (resolve, reject) => {
      console.log("+++++++++ userFun.getProductByName() +++++++++");

      try {
        const productURL = req.params.url;
        if (!productURL) {
          return resolve(
            res.status(400).json({ message: "Product name is required" })
          );
        }

        // Query product by language-specific name
        const query = {};
        query[`meta.slug`] = productURL;
        const product = await Product.findOne(query);

        if (!product) {
          return resolve(
            res.status(404).json({ message: "Product not found" })
          );
        }

        return resolve(product.toObject());
      } catch (err) {
        return resolve(
          res
            .status(500)
            .json({ message: "Internal server error", error: err.message })
        );
      }
    });
  },
  getCategoryByProductId: (req, res, categoryId) => {
    return new Promise(async (resolve, reject) => {
      console.log("+++++++++ userFun.getCategoryByProductId() +++++++++");
      try {
        const category = await Category.findOne({ _id: categoryId });

        if (!category) {
          return resolve(null);
        }
        console.log(category);
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
        const brand = await Brand.findOne({ _id: brandId });

        if (!brand) {
          return resolve(null);
        }
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
      console.log("Product ID:", productId);
      try {
        const reviews = await Reviews.find({
          product_Id: productId,
          hidden: false,
        }).sort({ createdAt: -1 });

        if (!reviews || reviews.length === 0) {
          return resolve(null);
        }

        console.log("Reviews found:", reviews.length);
        return resolve(reviews.map(review => review.toObject())); // ✅ fixed
      } catch (err) {
        console.log("getProductReviews error:\n", err);
        return resolve(null);
      }
    });
  },
  saveDummyCategory: (req, res) => {
    return new Promise(async (resolve, reject) => {
      console.log(
        "+++++++++++++++++++     userFun.saveDummyCategory()     +++++++++++++++++++++++++++"
      );
      try {
        const categories = [
          { name: { en: "Burgers", ar: "برجر" } },
          { name: { en: "Wraps", ar: "راب" } },
          { name: { en: "Sandwiches", ar: "ساندويتشات" } },
          { name: { en: "Milkshakes", ar: "ميلك شيك" } },
          { name: { en: "Pasta", ar: "باستا" } },
          { name: { en: "Pizza", ar: "بيتزا" } },
          { name: { en: "Coffee", ar: "قهوة" } },
          { name: { en: "Drinks", ar: "مشروبات" } },
          { name: { en: "Desserts", ar: "حلويات" } },
        ];

        if (categories) {
          const result = await Category.insertMany(categories);
          if (result) {
            console.log("Categories saved successfully");
            return resolve(null);
          } else {
            console.log("Failed to save categories");
            return resolve(null);
          }
        }
      } catch (err) {
        console.log("saveDummyCategory err :\n\n", err);
        return resolve(null);
      }
    });
  },
  saveDummyBrand: (req, res) => {
    return new Promise(async (resolve, reject) => {
      console.log(
        "+++++++++++++++++++     userFun.saveDummyBrand()     +++++++++++++++++++++++++++"
      );
      try {
        const brands = [
          {
            logo: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
            name: {
              en: "Grill Master",
              ar: "ملك الشواية",
            },
            tagline: "Expertly grilled flavors",
            createdAt: new Date("2024-10-01T12:00:00Z"),
          },
          {
            logo: "https://cdn-icons-png.flaticon.com/512/2965/2965567.png",
            name: {
              en: "Fresh Bites",
              ar: "لقمات طازجة",
            },
            tagline: "Freshness in every bite",
            createdAt: new Date("2024-10-10T14:30:00Z"),
          },
          {
            logo: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png",
            name: {
              en: "Pasta Point",
              ar: "نقطة الباستا",
            },
            tagline: "Your pasta, your way",
            createdAt: new Date("2024-11-05T09:45:00Z"),
          },
          {
            logo: "https://cdn-icons-png.flaticon.com/512/1046/1046786.png",
            name: {
              en: "Coffee Corner",
              ar: "ركن القهوة",
            },
            tagline: "Premium coffee collection",
            createdAt: new Date("2024-11-15T08:00:00Z"),
          },
          {
            logo: "https://cdn-icons-png.flaticon.com/512/685/685352.png",
            name: {
              en: "Sweet Treats",
              ar: "حلويات لذيذة",
            },
            tagline: "Indulge your sweet tooth",
            createdAt: new Date("2024-12-01T11:15:00Z"),
          },
        ];


        if (brands && brands.length) {
          const result = await Brand.insertMany(brands);
          if (result) {
            console.log("Brands saved successfully");
            return resolve(null);
          } else {
            console.log("Failed to save brands");
            return resolve(null);
          }
        }
      } catch (err) {
        console.log("saveDummyBrand err :\n\n", err);
        return resolve(null);
      }
    });
  },
  saveDummyReview: (req, res) => {
    return new Promise(async (resolve, reject) => {
      let dummyReviews = [
        {
          "user_Id": "664dbbbace552d63c95c8b81",
          "product_Id": "664dbb98ce552d63c95c8af9",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/men/11.jpg",
          "name": "John Doe",
          "profession": "Engineer",
          "review": "Excellent product. Works like a charm!",
          "rating": 5,
          "createdAt": "2025-05-22T08:00:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b82",
          "product_Id": "664dbb98ce552d63c95c8afa",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/women/12.jpg",
          "name": "Jane Smith",
          "profession": "Designer",
          "review": "Very satisfied with the quality.",
          "rating": 4,
          "createdAt": "2025-05-21T12:30:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b83",
          "product_Id": "664dbb98ce552d63c95c8afb",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/men/13.jpg",
          "name": "Michael Ray",
          "profession": "Teacher",
          "review": "Not bad, could use some improvements.",
          "rating": 3,
          "createdAt": "2025-05-20T10:00:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b84",
          "product_Id": "664dbb98ce552d63c95c8afc",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/women/14.jpg",
          "name": "Lisa Allen",
          "profession": "Nurse",
          "review": "Decent for the price range.",
          "rating": 4,
          "createdAt": "2025-05-19T09:45:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b85",
          "product_Id": "664dbb98ce552d63c95c8afd",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/men/15.jpg",
          "name": "Samuel Clark",
          "profession": "Photographer",
          "review": "Absolutely loved it!",
          "rating": 5,
          "createdAt": "2025-05-18T11:00:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b86",
          "product_Id": "664dbb98ce552d63c95c8afe",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/women/16.jpg",
          "name": "Emily Johnson",
          "profession": "Artist",
          "review": "Color wasn’t as expected.",
          "rating": 3,
          "createdAt": "2025-05-17T15:10:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b87",
          "product_Id": "664dbb98ce552d63c95c8aff",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/men/17.jpg",
          "name": "Robert Lee",
          "profession": "Chef",
          "review": "Fantastic build quality.",
          "rating": 4,
          "createdAt": "2025-05-16T14:20:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b88",
          "product_Id": "664dbb98ce552d63c95c8b00",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/women/18.jpg",
          "name": "Grace Kim",
          "profession": "Writer",
          "review": "Delivered on time, good value.",
          "rating": 4,
          "createdAt": "2025-05-15T13:00:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b89",
          "product_Id": "664dbb98ce552d63c95c8b01",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/men/19.jpg",
          "name": "Daniel Brooks",
          "profession": "Mechanic",
          "review": "Product did not meet my expectations.",
          "rating": 2,
          "createdAt": "2025-05-14T16:30:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b90",
          "product_Id": "664dbb98ce552d63c95c8b02",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/women/20.jpg",
          "name": "Nina Patel",
          "profession": "Architect",
          "review": "Great product and easy to use.",
          "rating": 5,
          "createdAt": "2025-05-13T17:00:00Z"
        },

        {
          "user_Id": "664dbbbace552d63c95c8b91",
          "product_Id": "664dbb98ce552d63c95c8b03",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/men/21.jpg",
          "name": "Chris Evans",
          "profession": "Actor",
          "review": "Solid item. Would buy again.",
          "rating": 4,
          "createdAt": "2025-05-12T08:15:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b92",
          "product_Id": "664dbb98ce552d63c95c8b04",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/women/22.jpg",
          "name": "Sarah James",
          "profession": "Nurse",
          "review": "Too fragile for daily use.",
          "rating": 2,
          "createdAt": "2025-05-11T09:45:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b93",
          "product_Id": "664dbb98ce552d63c95c8b05",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/men/23.jpg",
          "name": "Brandon Hall",
          "profession": "Pilot",
          "review": "Meets expectations, nothing fancy.",
          "rating": 3,
          "createdAt": "2025-05-10T10:30:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b94",
          "product_Id": "664dbb98ce552d63c95c8b06",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/women/24.jpg",
          "name": "Olivia Park",
          "profession": "Marketing Manager",
          "review": "Superb customer support.",
          "rating": 5,
          "createdAt": "2025-05-09T11:15:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b95",
          "product_Id": "664dbb98ce552d63c95c8b07",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/men/25.jpg",
          "name": "Tom Hanks",
          "profession": "Actor",
          "review": "Exactly as described. Happy with it.",
          "rating": 4,
          "createdAt": "2025-05-08T13:30:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b96",
          "product_Id": "664dbb98ce552d63c95c8b08",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/women/26.jpg",
          "name": "Amanda Brown",
          "profession": "Musician",
          "review": "Great gift option. Looks premium.",
          "rating": 5,
          "createdAt": "2025-05-07T12:10:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b97",
          "product_Id": "664dbb98ce552d63c95c8b09",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/men/27.jpg",
          "name": "Kevin Lee",
          "profession": "Engineer",
          "review": "Battery drains quickly.",
          "rating": 2,
          "createdAt": "2025-05-06T09:50:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b98",
          "product_Id": "664dbb98ce552d63c95c8b0a",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/women/28.jpg",
          "name": "Hannah Davis",
          "profession": "Consultant",
          "review": "Looks sleek and stylish.",
          "rating": 4,
          "createdAt": "2025-05-05T10:20:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b99",
          "product_Id": "664dbb98ce552d63c95c8b0b",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/men/29.jpg",
          "name": "Justin White",
          "profession": "Freelancer",
          "review": "Wouldn't recommend this one.",
          "rating": 1,
          "createdAt": "2025-05-04T11:30:00Z"
        },
        {
          "user_Id": "664dbbbace552d63c95c8b80",
          "product_Id": "664dbb98ce552d63c95c8b0c",
          "hidden": false,
          "profileImage": "https://randomuser.me/api/portraits/women/30.jpg",
          "name": "Sophia Green",
          "profession": "Chef",
          "review": "Perfect for my needs!",
          "rating": 5,
          "createdAt": "2025-05-03T14:00:00Z"
        }
      ]
      try {
        let saveReviews = await Reviews.insertMany(dummyReviews);
        if (saveReviews) {
          console.log("Dummy reviews saved successfully");
          return resolve(null);
        } else {
          console.log("Failed to save dummy reviews");
          return resolve(null);
        }
      } catch (err) {
        console.log("saveDummyReview err :\n\n", err);
        return resolve(null);
      }
    })
  },
  isProductWishlisted: (req, res, productId) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!productId) return resolve(false);

        // Case 1: Logged-in user
        if (res.locals.customer.user === "user") {
          const userId = req.session.user?.id;
          if (!userId) return resolve(false);

          const user = await User.findById(userId).select("wishlist");
          if (!user || !user.wishlist) return resolve(false);

          const isWishlisted = user.wishlist.includes(productId.toString());
          return resolve(isWishlisted);
        }

        // Case 2: Guest user
        if (res.locals.customer.user === "guest") {
          const guestWishlist = res.locals.customer.wishlist || [];
          const isWishlisted = guestWishlist.includes(productId.toString());
          return resolve(isWishlisted);
        }

        // Default fallback
        return resolve(false);
      } catch (error) {
        console.error("Error checking wishlist status:", error);
        return resolve(false); // Always resolve false on error
      }
    });
  },
  isProductInCart: async (req, res, productId) => {
    try {
      if (!productId) {
        return { inCart: false, qty: 0, total: 0 };
      }

      let cart = [];

      // Case 1: Logged-in user
      if (res.locals.customer.user === "user") {
        const user = await User.findById(req.session.user?.id).select("cart");
        if (!user || !user.cart) {
          return { inCart: false, qty: 0, total: 0 };
        }
        cart = user.cart;
      }

      // Case 2: Guest user
      else if (res.locals.customer.user === "guest") {
        cart = req.session.cart || [];
      }

      // Find product in cart
      const cartItem = cart.find(
        (item) => item.productId?.toString() === productId.toString()
      );

      if (!cartItem) {
        return { inCart: false, qty: 0, total: 0 };
      }

      // Fetch product price
      const product = await Product.findById(productId).select("pricing.price");
      const price = product?.pricing?.price || 0;
      const qty = cartItem.quantity || 0;
      const total = qty * price;

      return { inCart: true, qty, total };
    } catch (error) {
      console.error("Error checking if product is in cart:", error);
      return { inCart: false, qty: 0, total: 0 }; // Always return fallback on error
    }
  },
  getAllBrands: (req, res) => {
    return new Promise(async (resolve, reject) => {
      console.log("++++++++++++++ userFun.getAllBrands() ++++++++++++++");

      try {

        const brands = await Brand.find({});

        if (brands && brands.length > 0) {
          return resolve(brands);
        } else {
          return resolve(null);
        }
      } catch (err) {
        console.error("getBrands error:\n", err);
        return resolve(null);
      }
    });
  },


};

module.exports = userFun;
