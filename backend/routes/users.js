const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("preferences.favoriteSports", "name description icon")
      .populate("preferences.favoriteFacilities", "name description images");

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Server error while fetching profile" });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  [
    auth,
    body("firstName").optional().trim().isLength({ min: 2, max: 50 }),
    body("lastName").optional().trim().isLength({ min: 2, max: 50 }),
    body("phoneNumber").optional().isMobilePhone(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, phoneNumber } = req.body;
      const updateData = {};

      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
      ).select("-password");

      res.json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Server error while updating profile" });
    }
  }
);

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put(
  "/preferences",
  [
    auth,
    body("favoriteSports").optional().isArray(),
    body("favoriteFacilities").optional().isArray(),
    body("notifications.email").optional().isBoolean(),
    body("notifications.sms").optional().isBoolean(),
    body("notifications.push").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { favoriteSports, favoriteFacilities, notifications } = req.body;
      const updateData = {};

      if (favoriteSports !== undefined)
        updateData["preferences.favoriteSports"] = favoriteSports;
      if (favoriteFacilities !== undefined)
        updateData["preferences.favoriteFacilities"] = favoriteFacilities;

      if (notifications) {
        if (notifications.email !== undefined)
          updateData["preferences.notifications.email"] = notifications.email;
        if (notifications.sms !== undefined)
          updateData["preferences.notifications.sms"] = notifications.sms;
        if (notifications.push !== undefined)
          updateData["preferences.notifications.push"] = notifications.push;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
      ).select("-password");

      res.json({
        message: "Preferences updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update preferences error:", error);
      res
        .status(500)
        .json({ error: "Server error while updating preferences" });
    }
  }
);

// @route   GET /api/users/bookings
// @desc    Get user's bookings
// @access  Private
router.get("/bookings", [auth], async (req, res) => {
  try {
    console.log("GET /users/bookings called for user:", req.user._id);
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (status && status !== "undefined") filter.status = status;

    console.log("Booking filter:", filter);

    const bookings = await require("../models/Booking")
      .find(filter)
      .populate("facility", "name address images")
      .populate("sport", "name icon")
      .populate("user", "firstName lastName email")
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await require("../models/Booking").countDocuments(filter);

    console.log(`Found ${bookings.length} bookings for user ${req.user._id}`);
    console.log(
      "Sample booking:",
      bookings[0]
        ? {
            id: bookings[0]._id,
            facility: bookings[0].facility?.name,
            sport: bookings[0].sport?.name,
            date: bookings[0].date,
            status: bookings[0].status,
          }
        : "No bookings"
    );

    res.json({
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get user bookings error:", error);
    res.status(500).json({ error: "Server error while fetching bookings" });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (admin only)
// @access  Private (Admin)
router.get("/:id", [auth, authorize("admin")], async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Server error while fetching user" });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user by ID (admin only)
// @access  Private (Admin)
router.put(
  "/:id",
  [
    auth,
    authorize("admin"),
    body("role").optional().isIn(["user", "admin", "facility_owner"]),
    body("isActive").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Server error while updating user" });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Delete user by ID (admin only)
// @access  Private (Admin)
router.delete("/:id", [auth, authorize("admin")], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Soft delete - mark as inactive
    user.isActive = false;
    await user.save();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Server error while deleting user" });
  }
});

module.exports = router;
