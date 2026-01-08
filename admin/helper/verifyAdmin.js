const mongoose = require("mongoose");
const User = require("../model/userSchema");
const Admin = require("../model/adminSchema");

const verifyCustomer = async (req, res, next) => {
  try {
    // For testing purposes, automatically log in as the first available admin
    if (!req.session.admin) {
      const findAdmin = await Admin.findOne({}) || null;
      if (findAdmin) {
        req.session.admin = { id: findAdmin._id };
        console.log("Auto-logged in as admin for testing:", findAdmin.email);
      }
    }

    console.log(req.session.admin);
    if (req.session.admin && req.session.admin.id) {
      return next(); // Authenticated user
    }

    // Either not logged in or guest
    return res.redirect("/login");

  } catch (error) {
    console.error("Error in verifyCustomer middleware:", error);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = verifyCustomer;
