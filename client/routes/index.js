var express = require("express");
var router = express.Router();
let userFun = require("../helper/userHelper");
var mongoose = require("mongoose");
let Product = require("../model/productSchema");
const gaetCustomer = require("../helper/getCustomer");
const startingHelper = require("../helper/startingHelper");
let resRender = require("../helper/resRender");

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
let cart = [
  {
    id: 1,
    name: "Espresso",
    description: "Single shot",
    price: 3.5,
    image:
      "https://images.unsplash.com/photo-1497636577773-f1231844b336?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    quantity: 1,
  },
  {
    id: 2,
    name: "Cappuccino",
    description: "With milk foam",
    price: 4.2,
    image:
      "https://images.unsplash.com/photo-1534687941688-651ccaafbff8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    quantity: 1,
  },
  {
    id: 3,
    name: "Croissant",
    description: "Butter",
    price: 3.8,
    image:
      "https://images.unsplash.com/photo-1534687941688-651ccaafbff8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    quantity: 1,
  },
  {
    id: 4,
    name: "Matcha Latte",
    description: "Hot or Iced",
    price: 5.2,
    image:
      "https://images.unsplash.com/photo-1497636577773-f1231844b336?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    quantity: 1,
  },
];
const products = [
  {
    id: 1,
    name: "Espresso",
    category: "Coffee",
    description: "Single shot",
    price: 3.5,
    image:
      "https://images.unsplash.com/photo-1497636577773-f1231844b336?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    quantity: 1,
    review: 4,
    review_count: 10,
    liked: false,
  },
  {
    id: 2,
    name: "Cappuccino",
    category: "Cold Drink",
    description: "With milk foam",
    price: 4.2,
    image:
      "https://images.unsplash.com/photo-1534687941688-651ccaafbff8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    quantity: 1,
    review: 3,
    review_count: 10,
    liked: true,
  },
  {
    id: 3,
    name: "Croissant",
    category: "Pastry",
    description: "Butter",
    price: 3.8,
    image:
      "https://images.unsplash.com/photo-1534687941688-651ccaafbff8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    quantity: 1,
    review: 5,
    review_count: 10,
    liked: false,
  },
  {
    id: 4,
    name: "Matcha Latte",
    category: "Tea",
    description: "Hot or Iced",
    price: 5.2,
    image:
      "https://images.unsplash.com/photo-1497636577773-f1231844b336?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
    quantity: 1,
    review: 2,
    review_count: 10,
    liked: false,
  },
];
const dummyProducts = [
  {
    name: { en: "Classic Beef Burger", ar: "برجر لحم كلاسيكي" },
    description: {
      en: "Juicy grilled beef patty with lettuce, tomato, and our special sauce.",
      ar: "قطعة لحم مشوية مع الخس والطماطم وصلصتنا الخاصة.",
    },
    pricing: { price: 28, costPerItem: 15, currency: "AED" },
    images: [
      "https://images.unsplash.com/photo-1579888944880-d98341245702?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80",
    ],
    inStock: 25,
    meta: {
      slug: "classic-beef-burger",
      keywords: ["burger", "beef", "grill"],
    },
    sales: {
      totalUnitsSold: 102,
      totalRevenue: 2856,
      totalLikes: 34,
      totalOrders: 80,
      lastSoldAt: new Date(),
      starRating: 4,
      totalReviews: 21,
    },
    status: {
      isPublished: true,
      isFeatured: true,
      isNew: false,
      isPopular: true,
    },
    categoryId: "683fdd05cd4061d7070fadca", // Burgers
    brandId: "683fdcd0cd4061d7070fadc4",   // Grill Master
  },
  {
    name: { en: "Chicken Wrap", ar: "راب دجاج" },
    description: {
      en: "Grilled chicken with veggies and garlic sauce in a soft wrap.",
      ar: "دجاج مشوي مع الخضروات وصلصة الثوم داخل خبز ملفوف.",
    },
    pricing: { price: 22, costPerItem: 11, currency: "AED" },
    images: [
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-4.0.3&auto=format&fit=crop&w=1037&q=80",
    ],
    inStock: 40,
    meta: { slug: "chicken-wrap", keywords: ["wrap", "chicken", "garlic"] },
    sales: {
      totalUnitsSold: 80,
      totalRevenue: 1760,
      totalLikes: 22,
      totalOrders: 70,
      lastSoldAt: new Date(),
      starRating: 4.5,
      totalReviews: 25,
    },
    status: {
      isPublished: true,
      isFeatured: false,
      isNew: true,
      isPopular: true,
    },
    categoryId: "683fdd05cd4061d7070fadcb", // Wraps
    brandId: "683fdcd0cd4061d7070fadc5",   // Fresh Bites
  },
  {
    name: { en: "Tuna Sandwich", ar: "ساندويتش تونة" },
    description: {
      en: "Freshly made tuna sandwich with lettuce and mayo.",
      ar: "ساندويتش تونة طازج مع الخس والمايونيز.",
    },
    pricing: { price: 18, costPerItem: 9, currency: "AED" },
    images: [
      "https://images.unsplash.com/photo-1485808191679-5f86510681a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1173&q=80",
    ],
    inStock: 50,
    meta: { slug: "tuna-sandwich", keywords: ["tuna", "sandwich", "fresh"] },
    sales: {
      totalUnitsSold: 58,
      totalRevenue: 1044,
      totalLikes: 15,
      totalOrders: 40,
      lastSoldAt: new Date(),
      starRating: 2.5,
      totalReviews: 205,
    },
    status: {
      isPublished: true,
      isFeatured: false,
      isNew: false,
      isPopular: false,
    },
    categoryId: "683fdd05cd4061d7070fadcc", // Sandwiches
    brandId: "683fdcd0cd4061d7070fadc5",   // Fresh Bites
  },
  {
    name: { en: "Strawberry Milkshake", ar: "ميلك شيك فراولة" },
    description: {
      en: "Chilled strawberry shake with whipped cream topping.",
      ar: "ميلك شيك فراولة بارد مع طبقة من الكريمة.",
    },
    pricing: { price: 16, costPerItem: 7, currency: "AED" },
    images: [
      "https://images.unsplash.com/photo-1559181567-c3190ca9959b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1064&q=80",
    ],
    inStock: 60,
    meta: {
      slug: "strawberry-milkshake",
      keywords: ["milkshake", "strawberry", "drink"],
    },
    sales: {
      totalUnitsSold: 97,
      totalRevenue: 1552,
      totalLikes: 39,
      totalOrders: 90,
      lastSoldAt: new Date(),
      starRating: 1,
      totalReviews: 4,
    },
    status: {
      isPublished: true,
      isFeatured: true,
      isNew: false,
      isPopular: true,
    },
    categoryId: "683fdd05cd4061d7070fadcd", // Milkshakes
    brandId: "683fdcd0cd4061d7070fadc8",   // Sweet Treats
  },
  {
    name: { en: "Fettuccine Alfredo", ar: "فيتوتشيني ألفريدو" },
    description: {
      en: "Creamy pasta with chicken, mushrooms, and parmesan cheese.",
      ar: "باستا كريمية مع الدجاج والفطر وجبن البارميزان.",
    },
    pricing: { price: 34, costPerItem: 19, currency: "AED" },
    images: [
      "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1064&q=80",
    ],
    inStock: 20,
    meta: {
      slug: "fettuccine-alfredo",
      keywords: ["pasta", "alfredo", "chicken"],
    },
    sales: {
      totalUnitsSold: 42,
      totalRevenue: 1428,
      totalLikes: 18,
      totalOrders: 35,
      lastSoldAt: new Date(),
      starRating: 5,
      totalReviews: 893,
    },
    status: {
      isPublished: true,
      isFeatured: true,
      isNew: false,
      isPopular: false,
    },
    categoryId: "683fdd05cd4061d7070fadce", // Pasta
    brandId: "683fdcd0cd4061d7070fadc6",   // Pasta Point
  },
  {
    name: { en: "BBQ Chicken Pizza", ar: "بيتزا دجاج باربكيو" },
    description: {
      en: "BBQ sauce, grilled chicken, onions, and mozzarella on a crispy crust.",
      ar: "صلصة باربكيو، دجاج مشوي، بصل، وموزاريلا على عجينة مقرمشة.",
    },
    pricing: { price: 42, costPerItem: 24, currency: "AED" },
    images: [
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&auto=format&fit=crop&w=1064&q=80",
    ],
    inStock: 15,
    meta: { slug: "bbq-chicken-pizza", keywords: ["pizza", "bbq", "chicken"] },
    sales: {
      totalUnitsSold: 68,
      totalRevenue: 2856,
      totalLikes: 40,
      totalOrders: 58,
      lastSoldAt: new Date(),
      starRating: 4,
      totalReviews: 678,
    },
    status: {
      isPublished: true,
      isFeatured: true,
      isNew: true,
      isPopular: true,
    },
    categoryId: "683fdd05cd4061d7070fadcf", // Pizza
    brandId: "683fdcd0cd4061d7070fadc4",   // Grill Master
  },
  {
    name: { en: "Espresso", ar: "إسبريسو" },
    description: {
      en: "Rich and strong espresso shot made from premium beans.",
      ar: "جرعة إسبريسو غنية وقوية مصنوعة من حبوب فاخرة.",
    },
    pricing: { price: 10, costPerItem: 4, currency: "AED" },
    images: [
      "https://images.unsplash.com/photo-1497636577773-f1231844b336?ixlib=rb-4.0.3&auto=format&fit=crop&w=687&q=80",
    ],
    inStock: 100,
    meta: { slug: "espresso", keywords: ["coffee", "espresso", "cafe"] },
    sales: {
      totalUnitsSold: 120,
      totalRevenue: 1200,
      totalLikes: 65,
      totalOrders: 110,
      lastSoldAt: new Date(),
      starRating: 2,
      totalReviews: 2,
    },
    status: {
      isPublished: true,
      isFeatured: false,
      isNew: false,
      isPopular: true,
    },
    categoryId: "683fdd05cd4061d7070fadd0", // Coffee
    brandId: "683fdcd0cd4061d7070fadc7",   // Coffee Corner
  },
];


/* GET home page. */
router.get("/", async function (req, res, next) {
  let categories = await userFun.getCategory(req, res);
  // let brands= await userFun.getBrand(req, res)
  let productArray = await userFun.getProduct(
    req,
    res,
    (limit = 4),
    (page = 1)
  );
  let brandsArray = await userFun.getBrand(req, res);
  let resRender = require("../helper/resRender");
  resRender(req, res, "index", "index_Ar", {
    title: "Express",
    categories,
    products: productArray,
    brands: brandsArray,
  })
});
router.get("/not-found", function (req, res, next) {
  res.render("error/404", { title: "Express" });
});
router.get("/server-err", function (req, res, next) {
  res.render("Err/server_err", { title: "Express" });
});
router.get("/shop", async function (req, res, next) {
  let categories = await userFun.getCategory(req, res);
  // let brands= await userFun.getBrand(req, res)
  let productArray = await userFun.getProduct(
    req,
    res,
    (limit = process.env.PRODUCT_LIMIT),
    (page = 1)
  );
  let brandsArray = await userFun.getBrand(req, res);

  resRender(req, res, "pages/shop/shop", "pages/shop/shop_Ar", {
    title: "Express",
    categories,
    products: productArray,
    brands: brandsArray,
  })

});
router.get("/product/:url", async function (req, res, next) {
  let product = await userFun.getProductByURL(req, res);
  if (!product) {
    return res.redirect('/not-found');
  }
  product.category = await userFun.getCategoryByProductId(req, res, product.categoryId);
  product.brand = await userFun.getBrandById(req, res, product.brandId);
  product.reviews = await userFun.getProductReviews(req, res, product._id);
  product.isWishlisted = await userFun.isProductWishlisted(req, res, product._id);
  product.isInCart = await userFun.isProductInCart(req, res, product._id);
  console.log("Product: ", product);
  console.log(res.locals.customer.wishlist);
  console.log(product);
  // 
  resRender(req, res, "pages/product/product", "pages/product/product_AR", {
    product
  })
  // res.json(product);
  // res.render("pages/product/product_AR", { product });
})
router.post("/get-wishlist", function (req, res, next) {
  let randomValue = Math.random(); // Random value between 0 and 1
  console.log("Random Value: ", randomValue);

  // if (randomValue < 0.5) {
  //   // Logic for 50% chance
  //   console.log("50% chance: Wishlist items are unchanged.");
  //   // Simulate keeping the wishlist items as they are
  // } else {
  //   // Logic for 50% chance (when randomValue >= 0.5)
  //   // wishlistItems = [];  // Empty the wishlist items
  //   console.log("50% chance: Wishlist items are cleared.");
  // }
  console.log("Wishlist items: ", wishlistItems);
  res.status(200).json(wishlistItems);

});

router.post("/get-cart", (req, res) => {
  const itemId = parseInt(req.params.id);
  return res.status(200).json(cart);
});

router.post("/get-products", async (req, res) => {
  try {
    let filteredProducts = await userFun.getProductByFilter(req, res);
    req.body.limit = process.env.PRODUCT_LIMIT;

    let wishArray = res.locals.customer.wishlist
    // console.log("Customer wishlist: ", res.locals.customer);
    res.status(200).json({ filteredProducts, wishArray });
  } catch (err) {
    console.log(err);
  }
});

router.get("/contact", async (req, res) => {
  resRender(req, res, "pages/contact/contact", "pages/contact/contact_AR", {
  })

})
router.get("/faq", async (req, res) => {
  res.render("pages/FAQ/FAQ")
})
router.get("/company-profile", async (req, res) => {
  let brands = []
  brands = await userFun.getAllBrands(req, res);
  console.log("\nBrands: \n", brands);
  resRender(req, res, "pages/profile/profile", "pages/profile/profile_AR", { brands })

})
router.get("/privacy-policy", async (req, res) => {
  resRender(req, res, "privacy-policy", "privacy-policy_AR", {})
  // res.render("privacy-policy")
})
router.get("/terms-and-conditions", async (req, res) => {
  resRender(req, res, "terms-and-conditions", "terms-and-conditions_AR", {})
  // res.render("terms-and-conditions")
})
router.get("/template", async (req, res) => {
  res.render("template")
})
router.get("/template1", async (req, res) => {
  res.render("template1")
})

router.get("/add-dummy-data", async (req, res) => {
  await startingHelper.createDummyData(req, res);
})

router.get("/add-dummy-charges", async (req, res) => {
  await startingHelper.createDummyCharges(req, res);
})

router.get("/add-dummy-order", async (req, res) => {
  await startingHelper.createDummyOrder(req, res);
})

router.get("/map", async (req, res) => {
  res.render("map")
})
module.exports = router;
