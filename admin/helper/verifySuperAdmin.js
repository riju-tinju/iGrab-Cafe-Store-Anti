const mongoose = require("mongoose");
const User = require("../model/userSchema");

const verifySuperAdmin = async (req, res, next) => {
  try {
    console.log(req.session.admin);
    // req.session.admin={id:'685dbdec92ae3669fbfb7b01'}// For testing purposes, remove this line in production
    if (req.session.admin && req.session.admin.role === 'superadmin') {
      return next(); // Authenticated user
    }

    // Either not logged in or guest
    return res.send("Unauthorized access.");

  } catch (error) {
    console.error("Error in verifyCustomer middleware:", error);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = verifySuperAdmin;
