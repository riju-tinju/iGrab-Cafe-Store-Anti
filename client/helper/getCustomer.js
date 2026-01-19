const mongoose = require("mongoose");
const User = require("../model/userSchema");
const Store = require("../model/storeBranchSchema");
const SiteContent = require("../model/metaSchema");

const getCustomer = async (req, res, next) => {
  let customer = {
    name: "Guest",
    profile_image: null,
    wishlist: [],
    cart: [],
    addresses: [],
    allBranches: [],
    selectedBranch: null,
    language: req.session.lang || "en",
    total_cart: 0,
    user: "unknown",
  };

  try {
    // 🔒 Logged-in user
    if (req.session.user && req.session.user.id) {
      const userId = req.session.user.id;

      const customerArr = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId) } },
        {
          $project: {
            profile_image: 1,
            firstName: 1,
            lastName: 1,
            wishlist: 1,
            cart: 1,
            addresses: 1,
            language: 1,
            total_cart: { $sum: "$cart.quantity" },
          }
        }
      ]);

      const userData = customerArr[0];

      if (userData) {
        customer = {
          ...customer,
          name: `${userData.firstName} ${userData.lastName || ''}`,
          profile_image: userData.profile_image,
          wishlist: userData.wishlist || [],
          cart: userData.cart || [],
          addresses: userData.addresses || [],
          language: userData.language || "en",
          total_cart: userData.total_cart || 0,
          user: "user"
        };
      }
      customer._id = userId;

    } else {
      // 🧑 Guest user
      customer.cart = req.session.cart || [];
      customer.total_cart = customer.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
      customer.wishlist = req.session.wishlist || [];
      customer.user = "guest";
      customer.branch = req.session.selectedBranch || null;
      customer.selectedBranch = req.session.selectedBranch || null;
      customer.language = req.session.lang || "en";
    }
    //get available branches
    let allBranches = await Store.find({})
    if (allBranches && allBranches.length > 0) {
      customer.allBranches = allBranches;
    }

    if (!customer.selectedBranch) {
      const branch = await Store.findOne({}).sort({ _id: 1 });
      if (branch && branch._id) {
        customer.selectedBranch = branch._id;
        req.session.selectedBranch = branch._id || null; // Save default branch in session
      }
    }

    if (customer.selectedBranch) {
      let isExistBranch = await Store.findOne({ _id: customer.selectedBranch });
      if (isExistBranch) {
        customer.selectedBranch = isExistBranch._id;
        customer.branch = isExistBranch._id;
      } else {
        customer.selectedBranch = null;
        customer.branch = null;
      }
    }

    // If still no branch selected and there are branches, pick the first one
    if (!customer.selectedBranch && customer.allBranches.length > 0) {
      customer.selectedBranch = customer.allBranches[0]._id;
      customer.branch = customer.allBranches[0]._id;
    }

    // Fetch Site Content for SEO
    const siteContent = await SiteContent.findOne({});
    res.locals.siteContent = siteContent || {
      homeTitle: { en: "iGrab Story", ar: "آي جراب ستوري" },
      metaDescription: { en: "Premium Café & Store", ar: "مقهى ومتجر مميز" },
      metaKeywords: { en: ["coffee", "cafe", "store"], ar: ["قهوة", "مقهى", "متجر"] }
    };

    // ✅ Save for views or later use
    res.locals.customer = customer;
    next();
  } catch (error) {
    console.error("Error in getCustomer middleware:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = getCustomer;
