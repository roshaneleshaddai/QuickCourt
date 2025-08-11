const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const OTP = require("../models/OTP");
const { sendOTPEmail } = require("../utils/emailSender");
const otpGenerator = require('otp-generator');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d",
  });
};

// @route   POST /api/auth/check-email
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    res.status(200).json({ exists: !!user });
  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({ error: 'Error checking email' });
  }
});

// @route   POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false
    });

    // Save OTP to database
    const otpDocument = new OTP({ email, otp });
    await otpDocument.save();

    // Send OTP via email
    await sendOTPEmail(email, otp);

    res.status(200).json({ 
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('OTP sending error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send OTP' 
    });
  }
});

// @route   POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the most recent OTP for the email
    const otpRecord = await OTP.findOne({ email })
      .sort({ createdAt: -1 })
      .exec();

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: 'OTP not found or expired'
      });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters"),
    body("lastName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("phoneNumber")
      .optional()
      .custom((value) => {
        if (value && value.trim() !== '') {
          // Only validate if phone number is provided
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(value)) {
            throw new Error('Please provide a valid phone number');
          }
        }
        return true;
      }),
    body("role")
      .optional()
      .isIn(["user", "facility_owner"])
      .withMessage("Role must be either 'user' or 'facility_owner'"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email, password, phoneNumber, role } =
        req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      }

      // Security check: Only allow admin creation by existing admins
      if (role === "admin") {
        return res.status(403).json({
          error:
            "Admin accounts can only be created by existing administrators",
        });
      }

      // Create new user
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        role: role || "user", // Default to 'user' if not specified
      });

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      // Return user data (without password) and token
      res.status(201).json({
        message: "User registered successfully",
        token,
        user: user.getProfile(),
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Server error during registration" });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user and include password for comparison
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(400).json({ error: "Account is deactivated" });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken(user._id);

      res.json({
        message: "Login successful",
        token,
        user: user.getProfile(),
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Server error during login" });
    }
  }
);

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post(
  "/change-password",
  [
    body("currentPassword")
      .exists()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id; // This will come from auth middleware

      // Find user and include password
      const user = await User.findById(userId).select("+password");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Server error during password change" });
    }
  }
);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset OTP
// @access  Public
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists or not
        return res.json({
          message: "If an account exists, a password reset email has been sent",
        });
      }

      // Generate OTP for password reset
      const otp = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false
      });

      // Save OTP to database
      const otpDocument = new OTP({ email, otp });
      await otpDocument.save();

      // Send OTP via email
      await sendOTPEmail(email, otp);

      res.json({
        message: "If an account exists, a password reset email has been sent",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Server error during password reset" });
    }
  }
);

// @route   POST /api/auth/reset-password
// @desc    Reset user password after OTP verification
// @access  Public
router.post(
  "/reset-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, otp, password } = req.body;

      // Verify OTP first
      const otpRecord = await OTP.findOne({ email })
        .sort({ createdAt: -1 })
        .exec();

      if (!otpRecord) {
        return res.status(400).json({
          error: "OTP not found or expired"
        });
      }

      if (otpRecord.otp !== otp) {
        return res.status(400).json({
          error: "Invalid OTP"
        });
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          error: "User not found"
        });
      }

      // Update password
      user.password = password;
      await user.save();

      // Delete the used OTP
      await OTP.findByIdAndDelete(otpRecord._id);

      res.json({
        message: "Password reset successfully"
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Server error during password reset" });
    }
  }
);

module.exports = router;
