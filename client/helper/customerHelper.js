const mongoose = require("mongoose");
const Product = require("../model/productSchema");
const Category = require("../model/categorySchema");
const Brand = require("../model/brandSchema");
const Reviews = require("../model/reviewSchema");
const User = require("../model/userSchema");

const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'jadhugd@gmail.com',
    pass: 'vocx eblx dvou rxyu'
  }
});

const customerFun = {
  checkAndGenerateOTPUser: async (req, res) => {
    try {
      const { email, name } = req.body;

      // Basic validations
      if (!email) return res.status(400).json({ error: "Email is required" });
      if (!name) return res.status(400).json({ error: "Name is required" });

      // Generate OTP and expiry
      const otp = customerFun.generateOTP();
      const otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      let user = await User.findOne({ email });

      if (user) {
        // User exists – update OTP
        user.otp.otp = otp;
        user.otp.expiresAt = otpExpiresAt;
        user.otp.chances = 3; // Reset chances
        await user.save();

        console.log("OTP regenerated for existing user:", otp);
        await customerFun.sendOtpEmail(name, email, otp, "login").catch(err => {
          console.error("Failed to send OTP email:", err);
          return res.status(500).json({ error: "Failed to send OTP email" });
        });

        return res.status(200).json({ success: true, });
      }

      // User doesn't exist – create new user
      const newUser = new User({
        firstName: name,
        email,
        otp: {
          otp,
          expiresAt: otpExpiresAt
        },
        status: "deactive"
      });

      await newUser.save();
      console.log("New user created with OTP:", otp);
      await customerFun.sendOtpEmail(name, email, otp, "register").catch(err => {
        console.error("Failed to send OTP email:", err);
        return res.status(500).json({ error: "Failed to send OTP email" });
      });

      res.status(200).json({ success: true })
      return
    } catch (err) {
      console.error("Error in checkAndGenerateOTPUser:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  /**
   * Sends an OTP email to the user.
   */
  sendOtpEmail: async (name, email, otp, type = "login") => {
    try {
      const subject =
        type === "register"
          ? "Your OTP for Registration"
          : "Your OTP for Login";

      const text = `Your One Time Password (OTP) to ${type} is: ${otp}. This OTP is valid for 5 minutes.`;

      const html = `
      <p>Hi <b>${name}</b>,</p>
      <p>Your One Time Password (OTP) to ${type} is: 
      <strong>${otp}</strong>. This OTP is valid for 5 minutes.</p>
    `;

      const mailOptions = {
        from: `"${process.env.BRAND_NAME}" <${process.env.EMAIL}>`,
        to: email,
        subject,
        text,
        html
      };


      await transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${email}`);
      return true;
    } catch (err) {
      console.error("Failed to send OTP email:", err);
      throw new Error("Email sending failed");
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
      const { email, otp } = req.body;

      // Validate input
      if (!email || !otp) {
        return res.status(400).json({
          error: "Both email and OTP are required"
        });
      }

      // Find user by email
      const user = await User.findOne({ email });
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

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully"
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
