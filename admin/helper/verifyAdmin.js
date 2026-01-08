const mongoose = require("mongoose");
const User = require("../model/userSchema");

const verifyCustomer = async (req, res, next) => {
  try {
    console.log(req.session.admin);
    req.session.admin = {
      id: '695c8f151a5379a5e7cd4088',
      role: 'superadmin',
      selectedBranch: null
    }
    // req.session.admin={id:'685dbdec92ae3669fbfb7b01'}// For testing purposes, remove this line in production
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
