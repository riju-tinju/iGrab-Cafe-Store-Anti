const mongoose = require("mongoose");
const User = require("../model/userSchema");

const verifyCustomer = async (req, res, next) => {
  try {
    const customer = res.locals.customer;

    if (customer && customer.user === "user") {
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
