const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Facility = require("../models/Facility");
const Booking = require("../models/Booking");
const Sport = require("../models/Sport");
const Review = require("../models/Review");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

// Apply auth and admin authorization to all admin routes
router.use(auth);
router.use(authorize("admin"));

// ========================================
// ADMIN DASHBOARD STATS
// ========================================

// @route   GET /api/admin/dashboard/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get("/dashboard/stats", async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalFacilityOwners = await User.countDocuments({
      role: "facility_owner",
    });
    const totalBookings = await Booking.countDocuments();
    const totalFacilities = await Facility.countDocuments();
    const totalSports = await Sport.countDocuments();
    const totalReviews = await Review.countDocuments();

    // Get pending facility approvals
    const pendingFacilities = await Facility.countDocuments({
      status: "pending",
    });

    // Get recent activity (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const recentBookings = await Booking.countDocuments({
      createdAt: { $gte: lastWeek },
    });

    const recentUsers = await User.countDocuments({
      createdAt: { $gte: lastWeek },
    });

    // Get earnings simulation (total from all confirmed/completed bookings)
    const earningsData = await Booking.aggregate([
      {
        $match: {
          status: { $in: ["confirmed", "completed"] },
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalEarnings =
      earningsData.length > 0 ? earningsData[0].totalEarnings : 0;

    // Get top sports by facility count
    const topSports = await Sport.aggregate([
      {
        $lookup: {
          from: "facilities",
          localField: "_id",
          foreignField: "sports.sport",
          as: "facilities",
        },
      },
      {
        $project: {
          name: 1,
          facilityCount: { $size: "$facilities" },
        },
      },
      {
        $sort: { facilityCount: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    res.json({
      overview: {
        totalUsers,
        totalFacilityOwners,
        totalBookings,
        totalFacilities,
        totalSports,
        totalReviews,
        pendingFacilities,
      },
      recentActivity: {
        recentBookings,
        recentUsers,
      },
      financials: {
        totalEarnings,
      },
      topSports,
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching dashboard stats" });
  }
});

// ========================================
// FACILITY APPROVAL MANAGEMENT
// ========================================

// @route   GET /api/admin/facilities/pending
// @desc    Get all pending facility approvals
// @access  Private (Admin only)
router.get("/facilities/pending", async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = { status: "pending" };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { "address.city": { $regex: search, $options: "i" } },
      ];
    }

    const pendingFacilities = await Facility.find(filter)
      .populate("owner", "firstName lastName email")
      .populate("sports.sport", "name icon")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Facility.countDocuments(filter);

    res.json({
      facilities: pendingFacilities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get pending facilities error:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching pending facilities" });
  }
});

// @route   PUT /api/admin/facilities/:id/approve
// @desc    Approve a facility
// @access  Private (Admin only)
router.put(
  "/facilities/:id/approve",
  [
    body("status")
      .isIn(["approved", "rejected"])
      .withMessage("Status must be approved or rejected"),
    body("adminNotes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Admin notes cannot exceed 500 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, adminNotes } = req.body;
      const facilityId = req.params.id;

      const facility = await Facility.findById(facilityId);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }

      if (facility.status !== "pending") {
        return res
          .status(400)
          .json({ error: "Facility is not pending approval" });
      }

      facility.status = status;
      facility.adminNotes = adminNotes;
      facility.approvedAt = new Date();
      facility.approvedBy = req.user._id;

      await facility.save();

      res.json({
        message: `Facility ${status} successfully`,
        facility,
      });
    } catch (error) {
      console.error("Facility approval error:", error);
      res
        .status(500)
        .json({ error: "Server error while processing facility approval" });
    }
  }
);

// ========================================
// USER MANAGEMENT
// ========================================

// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin only)
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};

    if (role) filter.role = role;
    if (status) filter.isActive = status === "active";
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Server error while fetching users" });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (ban/unban)
// @access  Private (Admin only)
router.put(
  "/users/:id/status",
  [
    body("isActive").isBoolean().withMessage("isActive must be a boolean"),
    body("adminNotes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Admin notes cannot exceed 500 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { isActive, adminNotes } = req.body;
      const userId = req.params.id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent admin from banning themselves
      if (user._id.toString() === req.user._id.toString()) {
        return res
          .status(400)
          .json({ error: "Cannot modify your own account status" });
      }

      user.isActive = isActive;
      user.adminNotes = adminNotes;
      user.statusUpdatedAt = new Date();
      user.statusUpdatedBy = req.user._id;

      await user.save();

      res.json({
        message: `User ${isActive ? "activated" : "deactivated"} successfully`,
        user: user.getProfile(),
      });
    } catch (error) {
      console.error("User status update error:", error);
      res
        .status(500)
        .json({ error: "Server error while updating user status" });
    }
  }
);

// @route   GET /api/admin/users/:id/bookings
// @desc    Get user's booking history
// @access  Private (Admin only)
router.get("/users/:id/bookings", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const bookings = await Booking.find({ user: userId })
      .populate("facility", "name address")
      .populate("sport", "name icon")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments({ user: userId });

    res.json({
      user: user.getProfile(),
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
    res
      .status(500)
      .json({ error: "Server error while fetching user bookings" });
  }
});

// ========================================
// REPORTS & MODERATION
// ========================================

// @route   GET /api/admin/reports
// @desc    Get user-submitted reports
// @access  Private (Admin only)
router.get("/reports", async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};
    if (status) filter.status = status;

    // For now, we'll return a placeholder since we don't have a Report model yet
    // This can be expanded when the Report model is implemented
    const reports = []; // Placeholder
    const total = 0; // Placeholder

    res.json({
      reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ error: "Server error while fetching reports" });
  }
});

// ========================================
// SPORTS MANAGEMENT
// ========================================

// @route   GET /api/admin/sports
// @desc    Get all sports with facility counts
// @access  Private (Admin only)
router.get("/sports", async (req, res) => {
  try {
    const sports = await Sport.aggregate([
      {
        $lookup: {
          from: "facilities",
          localField: "_id",
          foreignField: "sports.sport",
          as: "facilities",
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          category: 1,
          icon: 1,
          facilityCount: { $size: "$facilities" },
        },
      },
      {
        $sort: { facilityCount: -1 },
      },
    ]);

    res.json({ sports });
  } catch (error) {
    console.error("Get sports error:", error);
    res.status(500).json({ error: "Server error while fetching sports" });
  }
});

// ========================================
// ANALYTICS & CHARTS DATA
// ========================================

// @route   GET /api/admin/analytics/booking-trends
// @desc    Get booking activity over time for charts
// @access  Private (Admin only)
router.get("/analytics/booking-trends", async (req, res) => {
  try {
    const { period = "7d" } = req.query;

    let days;
    switch (period) {
      case "7d":
        days = 7;
        break;
      case "30d":
        days = 30;
        break;
      case "90d":
        days = 90;
        break;
      default:
        days = 7;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Generate sample data if no real data exists
    if (bookingTrends.length === 0) {
      const sampleData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        sampleData.push({
          _id: date.toISOString().split("T")[0],
          count: Math.floor(Math.random() * 20) + 5,
          totalAmount: Math.floor(Math.random() * 5000) + 1000,
        });
      }
      res.json({ bookingTrends: sampleData, period });
    } else {
      res.json({ bookingTrends, period });
    }
  } catch (error) {
    console.error("Get booking trends error:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching booking trends" });
  }
});

// @route   GET /api/admin/analytics/user-registration-trends
// @desc    Get user registration trends for charts
// @access  Private (Admin only)
router.get("/analytics/user-registration-trends", async (req, res) => {
  try {
    const { period = "7d" } = req.query;

    let days;
    switch (period) {
      case "7d":
        days = 7;
        break;
      case "30d":
        days = 30;
        break;
      case "90d":
        days = 90;
        break;
      default:
        days = 7;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const registrationTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
          users: { $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] } },
          facilityOwners: {
            $sum: { $cond: [{ $eq: ["$role", "facility_owner"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Generate sample data if no real data exists
    if (registrationTrends.length === 0) {
      const sampleData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        sampleData.push({
          _id: date.toISOString().split("T")[0],
          count: Math.floor(Math.random() * 10) + 2,
          users: Math.floor(Math.random() * 8) + 1,
          facilityOwners: Math.floor(Math.random() * 3) + 1,
        });
      }
      res.json({ registrationTrends: sampleData, period });
    } else {
      res.json({ registrationTrends, period });
    }
  } catch (error) {
    console.error("Get registration trends error:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching registration trends" });
  }
});

// @route   GET /api/admin/analytics/facility-approval-trends
// @desc    Get facility approval trends for charts
// @access  Private (Admin only)
router.get("/analytics/facility-approval-trends", async (req, res) => {
  try {
    const { period = "30d" } = req.query;

    let days;
    switch (period) {
      case "7d":
        days = 7;
        break;
      case "30d":
        days = 30;
        break;
      case "90d":
        days = 90;
        break;
      default:
        days = 30;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const approvalTrends = await Facility.aggregate([
      {
        $match: {
          $or: [
            { status: "approved", approvedAt: { $gte: startDate } },
            { status: "rejected", updatedAt: { $gte: startDate } },
            { status: "pending", createdAt: { $gte: startDate } },
          ],
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $cond: {
                  if: { $eq: ["$status", "pending"] },
                  then: "$createdAt",
                  else: "$approvedAt",
                },
              },
            },
          },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Generate sample data if no real data exists
    if (approvalTrends.length === 0) {
      const sampleData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        sampleData.push({
          _id: date.toISOString().split("T")[0],
          approved: Math.floor(Math.random() * 5) + 1,
          rejected: Math.floor(Math.random() * 2),
          pending: Math.floor(Math.random() * 3) + 1,
        });
      }
      res.json({ approvalTrends: sampleData, period });
    } else {
      res.json({ approvalTrends, period });
    }
  } catch (error) {
    console.error("Get facility approval trends error:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching facility approval trends" });
  }
});

// @route   GET /api/admin/analytics/sports-activity
// @desc    Get most active sports data for charts
// @access  Private (Admin only)
router.get("/analytics/sports-activity", async (req, res) => {
  try {
    const { period = "30d" } = req.query;

    let days;
    switch (period) {
      case "7d":
        days = 7;
        break;
      case "30d":
        days = 30;
        break;
      case "90d":
        days = 90;
        break;
      default:
        days = 30;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sportsActivity = await Sport.aggregate([
      {
        $lookup: {
          from: "facilities",
          localField: "_id",
          foreignField: "sports.sport",
          as: "facilities",
        },
      },
      {
        $lookup: {
          from: "bookings",
          let: { sportId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $gte: ["$createdAt", startDate] },
                    { $eq: ["$status", "confirmed"] },
                  ],
                },
              },
            },
          ],
          as: "recentBookings",
        },
      },
      {
        $project: {
          name: 1,
          facilityCount: { $size: "$facilities" },
          bookingCount: { $size: "$recentBookings" },
          totalBookings: { $size: "$recentBookings" },
        },
      },
      {
        $sort: { totalBookings: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Generate sample data if no real data exists
    if (sportsActivity.length === 0) {
      const sampleSports = [
        { name: "Football", facilityCount: 15, bookingCount: 120 },
        { name: "Basketball", facilityCount: 12, bookingCount: 95 },
        { name: "Tennis", facilityCount: 8, bookingCount: 75 },
        { name: "Cricket", facilityCount: 10, bookingCount: 85 },
        { name: "Badminton", facilityCount: 6, bookingCount: 60 },
      ];
      res.json({ sportsActivity: sampleSports, period });
    } else {
      res.json({ sportsActivity, period });
    }
  } catch (error) {
    console.error("Get sports activity error:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching sports activity" });
  }
});

// @route   GET /api/admin/analytics/earnings-simulation
// @desc    Get earnings simulation data for charts
// @access  Private (Admin only)
router.get("/analytics/earnings-simulation", async (req, res) => {
  try {
    const { period = "30d" } = req.query;

    let days;
    switch (period) {
      case "7d":
        days = 7;
        break;
      case "30d":
        days = 30;
        break;
      case "90d":
        days = 90;
        break;
      default:
        days = 30;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const earningsData = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ["confirmed", "completed"] },
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          dailyEarnings: { $sum: "$totalAmount" },
          bookingCount: { $sum: 1 },
          averageBookingValue: { $avg: "$totalAmount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Calculate cumulative earnings
    let cumulativeEarnings = 0;
    const earningsWithCumulative = earningsData.map((day) => {
      cumulativeEarnings += day.dailyEarnings;
      return {
        ...day,
        cumulativeEarnings,
      };
    });

    // Generate sample data if no real data exists
    if (earningsWithCumulative.length === 0) {
      const sampleData = [];
      let cumulative = 0;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dailyEarnings = Math.floor(Math.random() * 8000) + 2000;
        cumulative += dailyEarnings;
        sampleData.push({
          _id: date.toISOString().split("T")[0],
          dailyEarnings,
          cumulativeEarnings: cumulative,
          averageBookingValue: Math.floor(Math.random() * 500) + 200,
        });
      }
      res.json({ earningsData: sampleData, period });
    } else {
      res.json({ earningsData: earningsWithCumulative, period });
    }
  } catch (error) {
    console.error("Get earnings simulation error:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching earnings simulation" });
  }
});

module.exports = router;
