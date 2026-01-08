const mongoose = require("mongoose");
const Product = require("../model/productSchema");
const Category = require("../model/categorySchema");
const Brand = require("../model/brandSchema");
const Reviews = require("../model/reviewSchema");
const User = require("../model/userSchema");
const Admin = require("../model/adminSchema");
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
  createSuperAdmin: async (req, res) => {
    try {
      const { name, email } = req.params;

      if (!name || !email) {
        return res.status(400).json({ success: false, message: "Name and email are required" });
      }

      // Check if admin already exists
      const exists = await Admin.findOne({ email });
      if (exists) {
        return res.status(409).json({ success: false, message: "Super admin already exists" });
      }

      const admin = new Admin({
        name,
        email,
        role: 'superadmin',
        isActive: true
      });

      await admin.save();

      return res.status(201).json({
        success: true,
        message: "Super admin created successfully",
        data: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (err) {
      console.error("Error creating super admin:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  },
  checkAndGenerateOTPUser: async (req, res) => {
    try {
      const { email, name } = req.body;

      // Basic validations
      if (!email) return res.status(400).json({ error: "Email is required" });
      if (!name) return res.status(400).json({ error: "Name is required" });

      // Generate OTP and expiry
      const otp = customerFun.generateOTP();
      const otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      let user = await Admin.findOne({ email });

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

        return res.status(200).json({ success: true });
      }

      return res.status(404).json({ error: "User not found" });
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
      const user = await Admin.findOne({ email });
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

      user.otp = {
        otp: null,
        chances: 3,
        expiresAt: null
      };


      await user.save();

      // Set session
      req.session.admin = { id: user._id };
      console.log(req.session.admin);
      console.log("OTP verified successfully for user:", user);
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

  /**
   * Ensures initial data (Super Admin and Main Branch) exists.
   */
  ensureInitialData: async () => {
    try {
      const StoreBranch = require("../model/storeBranchSchema");

      // 1. Ensure at least one branch exists
      let branch = await StoreBranch.findOne();
      if (!branch) {
        console.log("No branches found. Creating default branch...");
        branch = new StoreBranch({
          name: "Main Branch",
          address: "Default Address, Dubai",
          email: "mainbranch@example.com",
          contactNumber: "0000000000",
          location: {
            type: "Point",
            coordinates: [55.2708, 25.2048] // Dubai Burj Khalifa approx
          }
        });
        await branch.save();
        console.log("Default branch created:", branch.name);
      }

      // 2. Ensure at least one Super Admin exists
      let admin = await Admin.findOne({ role: 'superadmin' });
      if (!admin) {
        console.log("No super admin found. Creating default super admin...");
        admin = new Admin({
          name: "System Admin",
          email: "jadhugd@gmail.com", // Using the email from nodemailer config
          role: 'superadmin',
          isActive: true,
          branches: [branch._id],
          selectedBranch: branch._id
        });
        await admin.save();
        console.log("Default super admin created:", admin.email);
      }

      return { branch, admin };
    } catch (err) {
      console.error("Error seeding initial data:", err);
    }
  },
}
module.exports = customerFun;
