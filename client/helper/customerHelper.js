const mongoose = require("mongoose");
const Product = require("../model/productSchema");
const Category = require("../model/categorySchema");
const Brand = require("../model/brandSchema");
const Reviews = require("../model/reviewSchema");
const User = require("../model/userSchema");

// Twilio Client Initialization
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const customerFun = {
  /**
   * Check user and generate/send OTP via SMS
   */
  checkAndGenerateOTPUser: async (req, res) => {
    try {
      const { name, countryCode, phone } = req.body;

      // Basic validations
      if (!countryCode) return res.status(400).json({ error: "Country code is required" });
      if (!phone) return res.status(400).json({ error: "Phone number is required" });
      if (!name) return res.status(400).json({ error: "Name is required" });

      const fullPhoneNumber = `${countryCode}${phone}`;

      // Generate OTP and expiry
      const otp = customerFun.generateOTP();
      const otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      let user = await User.findOne({ phone: phone, countryCode: countryCode });

      if (user) {
        // User exists – update OTP
        user.otp.otp = otp;
        user.otp.expiresAt = otpExpiresAt;
        user.otp.chances = 3; // Reset chances
        await user.save();

        console.log("OTP regenerated for existing user:", fullPhoneNumber, otp);

        try {
          await customerFun.sendOtpSMS(fullPhoneNumber, otp, "login");
          return res.status(200).json({ success: true, message: "OTP sent successfully" });
        } catch (err) {
          console.error("Failed to send SMS:", err);
          return res.status(500).json({ error: "Failed to send OTP SMS. Please try again." });
        }
      }

      // User doesn't exist – create new user
      const newUser = new User({
        firstName: name,
        email: null, // Email is now optional
        countryCode,
        phone,
        otp: {
          otp,
          expiresAt: otpExpiresAt
        },
        status: "deactive"
      });

      await newUser.save();
      console.log("New user created with OTP:", fullPhoneNumber, otp);

      try {
        await customerFun.sendOtpSMS(fullPhoneNumber, otp, "register");
        return res.status(200).json({ success: true, message: "OTP sent successfully" });
      } catch (err) {
        console.error("Failed to send SMS:", err);
        return res.status(500).json({ error: "Failed to send OTP SMS. Please try again." });
      }

    } catch (err) {
      console.error("Error in checkAndGenerateOTPUser:", err);
      // Handle MongoDB duplicate key error cleanly if sparse index fails
      if (err.code === 11000) {
        return res.status(400).json({ error: "User with this phone number already exists." });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  /**
   * Sends an OTP SMS to the user via Twilio.
   */
  sendOtpSMS: async (to, otp, type = "login") => {
    try {
      const body = `Your iGrab Story Cafe OTP is ${otp}. Valid for 5 minutes.`;

      if (!process.env.TWILIO_PHONE_NUMBER) {
        console.warn("TWILIO_PHONE_NUMBER not set in .env");
        // In dev mode/without creds, we might just log it and succeed
        return true;
      }

      await client.messages.create({
        body: body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      console.log(`OTP SMS sent to ${to}`);
      return true;
    } catch (err) {
      console.error("Failed to send OTP SMS:", err);
      throw new Error("SMS sending failed");
    }
  },

  /**
   * Generates a 6-digit numeric OTP.
   */
  generateOTP: () => {
    return Math.floor(100000 + Math.random() * 900000);
  },

  verifyOTPUser: async (req, res) => {
    try {
      const { countryCode, phone, otp } = req.body;

      // Validate input
      if (!countryCode || !phone || !otp) {
        return res.status(400).json({
          error: "Country code, phone, and OTP are required"
        });
      }

      // Find user by phone
      const user = await User.findOne({ phone: phone, countryCode: countryCode });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check OTP validity
      const { otp: userOTP } = user;
      if (!userOTP || userOTP.chances < 1) {
        return res.status(400).json({ error: "No OTP attempts remaining" });
      }

      // Verify OTP details
      const isOTPValid = (
        String(userOTP.otp) === String(otp) &&
        Date.now() <= userOTP.expiresAt
      );

      if (!isOTPValid) {
        user.otp.chances -= 1;
        await user.save();

        return res.status(400).json({
          error: "Invalid or expired OTP",
          attemptsRemaining: user.otp.chances
        });
      }

      // Successful verification - update user
      user.status = "active";
      user.otp = {
        otp: null,
        chances: 3,
        expiresAt: null
      };

      if (user.wishlist.length === 0) { user.wishlist = req.session.wishlist || []; }
      else {
        // Merge session wishlist with user's wishlist, avoiding duplicates
        if (req.session.wishlist && req.session.wishlist.length > 0) {
          // Combine both arrays and remove duplicates
          const combinedWishlist = [...new Set([...user.wishlist, ...req.session.wishlist])];
          user.wishlist = combinedWishlist;
        }
      }
      await user.save();

      // Set session
      req.session.user = { id: user._id };

      // Explicitly save session to MongoDB
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }

        console.log("Session saved successfully:", req.session.user);
        return res.status(200).json({
          success: true,
          message: "OTP verified successfully"
        });
      });

    } catch (err) {
      console.error("Error in verifyOTPUser:", err);
      return res.status(500).json({
        error: "Internal server error"
      });
    }
  },
}
module.exports = customerFun;
