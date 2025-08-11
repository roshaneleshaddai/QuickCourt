const express = require("express");
const { body, query, validationResult } = require("express-validator");
const Facility = require("../models/Facility");
const { auth, optionalAuth, authorize } = require("../middleware/auth");
const BlockedTimeSlot = require("../models/BlockedTimeSlot");
const Booking = require("../models/Booking");

const router = express.Router();

// Test endpoint to verify the route is working
router.get("/test", (req, res) => {
  res.json({ message: "Facilities route is working" });
});

// @route   GET /api/facilities
// @desc    Get all facilities with filtering and search
// @access  Public
router.get(
  "/",
  [
    query("search").optional().trim(),
    query("sport").optional().trim(),
    query("city").optional().trim(),
    query("rating")
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage("Rating must be a number between 0 and 5"),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { search, sport, city, rating, page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter = { isActive: true };

      if (search) {
        filter.$text = { $search: search };
      }

      if (sport) {
        // Look up sport by name first, then filter by sport ID
        const Sport = require("../models/Sport");
        const sportDoc = await Sport.findOne({
          name: { $regex: sport, $options: "i" },
        });
        if (sportDoc) {
          filter["sports.sport"] = sportDoc._id;
        }
      }

      if (city) {
        filter["address.city"] = { $regex: city, $options: "i" };
      }

      if (rating) {
        filter["rating.average"] = { $gte: parseFloat(rating) };
      }

      // Build aggregation pipeline
      const pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: "sports",
            localField: "sports.sport",
            foreignField: "_id",
            as: "sportDetails",
          },
        },
        {
          $addFields: {
            totalCourts: {
              $sum: {
                $map: {
                  input: "$sports",
                  as: "sport",
                  in: { $size: "$$sport.courts" },
                },
              },
            },
            // Restructure sports array to include populated sport data
            sports: {
              $map: {
                input: "$sports",
                as: "sportItem",
                in: {
                  $mergeObjects: [
                    "$$sportItem",
                    {
                      sport: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$sportDetails",
                              as: "sportDetail",
                              cond: {
                                $eq: ["$$sportDetail._id", "$$sportItem.sport"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
              },
            },
            // Add missing fields with default values
            hourlyRate: { $ifNull: ["$hourlyRate", 0] },
            distance: { $ifNull: ["$distance", "N/A"] },
          },
        },
        { $sort: { "rating.average": -1, "rating.count": -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
      ];

      const facilities = await Facility.aggregate(pipeline);
      const total = await Facility.countDocuments(filter);

      res.json({
        facilities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get facilities error:", error);
      res.status(500).json({ error: "Server error while fetching facilities" });
    }
  }
);

// @route   GET /api/facilities/my-facilities
// @desc    Get facilities owned by the current user
// @access  Private (Facility owners and admins)
router.get("/my-facilities", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", sport = "" } = req.query;

    // Build filter for user's facilities
    const filter = { owner: req.user._id };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (sport) {
      filter["sports.sport"] = sport;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const facilities = await Facility.find(filter)
      .populate("owner", "firstName lastName email")
      .populate("sports.sport", "name description icon category")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Facility.countDocuments(filter);

    res.json({
      facilities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get my facilities error:", error);
    res.status(500).json({ error: "Server error while fetching facilities" });
  }
});

// @route   GET /api/facilities/:id
// @desc    Get facility by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id)
      .populate("owner", "firstName lastName email")
      .populate("sports.sport", "name description icon category");

    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

    if (!facility.isActive) {
      return res.status(404).json({ error: "Facility not found" });
    }

    console.log("Sending facility response:", {
      id: facility._id,
      name: facility.name,
      hasSports: !!facility.sports,
      sportsCount: facility.sports?.length,
      hasAmenities: !!facility.amenities,
      amenitiesCount: facility.amenities?.length,
    });
    res.json(facility);
  } catch (error) {
    console.error("Get facility error:", error);
    res.status(500).json({ error: "Server error while fetching facility" });
  }
});

// @route   POST /api/facilities
// @desc    Create a new facility
// @access  Private (Facility owners and admins)
router.post(
  "/",
  [
    auth,
    authorize("admin", "facility_owner"),
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Facility name must be between 2 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description cannot exceed 1000 characters"),
    body("address.street")
      .trim()
      .notEmpty()
      .withMessage("Street address is required"),
    body("address.city").trim().notEmpty().withMessage("City is required"),
    body("address.state").trim().notEmpty().withMessage("State is required"),
    body("address.zipCode")
      .trim()
      .notEmpty()
      .withMessage("ZIP code is required"),
    body("address.country")
      .trim()
      .notEmpty()
      .withMessage("Country is required"),
    body("location.coordinates")
      .isArray({ min: 2, max: 2 })
      .withMessage("Coordinates must be an array of 2 numbers"),
    body("sports")
      .isArray({ min: 1 })
      .withMessage("At least one sport must be specified"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const facilityData = req.body;

      // Set owner to current user if not admin
      if (req.user.role !== "admin") {
        facilityData.owner = req.user._id;
      }

      const facility = new Facility(facilityData);
      await facility.save();

      res.status(201).json({
        message: "Facility created successfully",
        facility,
      });
    } catch (error) {
      console.error("Create facility error:", error);
      res.status(500).json({ error: "Server error while creating facility" });
    }
  }
);

// @route   PUT /api/facilities/:id
// @desc    Update facility
// @access  Private (Owner and admins)
router.put(
  "/:id",
  [
    auth,
    body("name").optional().trim().isLength({ min: 2, max: 100 }),
    body("description").optional().trim().isLength({ max: 1000 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const facility = await Facility.findById(req.params.id);

      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }

      // Check if user can update this facility
      if (
        req.user.role !== "admin" &&
        facility.owner.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          error: "Access denied. You can only update your own facilities",
        });
      }

      const updatedFacility = await Facility.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      res.json({
        message: "Facility updated successfully",
        facility: updatedFacility,
      });
    } catch (error) {
      console.error("Update facility error:", error);
      res.status(500).json({ error: "Server error while updating facility" });
    }
  }
);

// @route   DELETE /api/facilities/:id
// @desc    Delete facility
// @access  Private (Owner and admins)
router.delete("/:id", auth, async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);

    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

    // Check if user can delete this facility
    if (
      req.user.role !== "admin" &&
      facility.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        error: "Access denied. You can only delete your own facilities",
      });
    }

    // Soft delete - just mark as inactive
    facility.isActive = false;
    await facility.save();

    res.json({ message: "Facility deleted successfully" });
  } catch (error) {
    console.error("Delete facility error:", error);
    res.status(500).json({ error: "Server error while deleting facility" });
  }
});

// @route   GET /api/facilities/:id/availability
// @desc    Check facility availability for a specific date
// @access  Public
router.get(
  "/:id/availability",
  [query("date").isISO8601().withMessage("Valid date is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { date } = req.query;
      const facility = await Facility.findById(req.params.id);

      if (!facility || !facility.isActive) {
        return res.status(404).json({ error: "Facility not found" });
      }

      // TODO: Implement availability checking logic
      // This would check existing bookings and return available time slots

      res.json({
        facility: facility.name,
        date,
        message: "Availability checking not yet implemented",
      });
    } catch (error) {
      console.error("Check availability error:", error);
      res
        .status(500)
        .json({ error: "Server error while checking availability" });
    }
  }
);

// ========================================
// FACILITY OWNER SPECIFIC ROUTES
// ========================================

// @route   GET /api/facilities/facility-owner/dashboard/stats
// @desc    Get dashboard statistics for facility owner
// @access  Private (Facility owners only)
router.get("/facility-owner/dashboard/stats", [auth], async (req, res) => {
  try {
    // Check if user is a facility owner
    if (req.user.role !== "facility_owner") {
      return res
        .status(403)
        .json({ error: "Access denied. Facility owners only." });
    }

    // Get all facilities owned by the user
    const userFacilities = await Facility.find({ owner: req.user._id });

    // Calculate total courts
    const totalCourts = userFacilities.reduce((total, facility) => {
      return (
        total +
        facility.sports.reduce((sportTotal, sport) => {
          return sportTotal + sport.courts.length;
        }, 0)
      );
    }, 0);

    // Get total bookings for user's facilities
    const totalBookings = await Booking.countDocuments({
      facility: { $in: userFacilities.map((f) => f._id) },
    });

    // Get total earnings
    const earningsData = await Booking.aggregate([
      {
        $match: {
          facility: { $in: userFacilities.map((f) => f._id) },
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

    // Get unique users who have booked
    const uniqueUsers = await Booking.distinct("user", {
      facility: { $in: userFacilities.map((f) => f._id) },
    });

    const totalUsers = uniqueUsers.length;

    res.json({
      totalBookings,
      activeCourts: totalCourts,
      totalEarnings,
      totalUsers,
      totalFacilities: userFacilities.length,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching dashboard stats" });
  }
});

// @route   GET /api/facilities/facility-owner/bookings
// @desc    Get all bookings for owner's facilities
// @access  Private (Facility owners only)
router.get("/facility-owner/bookings", [auth], async (req, res) => {
  try {
    console.log("GET /facilities/facility-owner/bookings called");
    console.log("User:", req.user);
    console.log("User role:", req.user.role);

    // Check if user is a facility owner
    if (req.user.role !== "facility_owner") {
      console.log("Access denied: User is not a facility owner");
      return res
        .status(403)
        .json({ error: "Access denied. Facility owners only." });
    }

    const { page = 1, limit = 10, status, sort = "-createdAt" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all facilities owned by the user
    const userFacilities = await Facility.find({ owner: req.user._id });
    console.log("User facilities found:", userFacilities.length);
    console.log(
      "User facilities:",
      userFacilities.map((f) => ({ id: f._id, name: f.name }))
    );

    const facilityIds = userFacilities.map((f) => f._id);
    console.log("Facility IDs:", facilityIds);

    // Build filter
    const filter = { facility: { $in: facilityIds } };
    if (status && status !== "undefined") {
      filter.status = status;
    }

    // Get bookings with pagination
    console.log("Filter for bookings:", filter);

    // First, let's check if there are any bookings at all in the database
    const allBookings = await Booking.find({});
    console.log("Total bookings in database:", allBookings.length);
    if (allBookings.length > 0) {
      console.log("Sample booking:", {
        id: allBookings[0]._id,
        facility: allBookings[0].facility,
        status: allBookings[0].status,
        date: allBookings[0].date,
      });
    }

    const bookings = await Booking.find(filter)
      .populate("user", "firstName lastName email")
      .populate("facility", "name address")
      .populate("sport", "name icon")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    console.log("Bookings found:", bookings.length);
    console.log(
      "Bookings:",
      bookings.map((b) => ({
        id: b._id,
        facility: b.facility?.name,
        court: b.court?.name,
        user: b.user?.firstName,
      }))
    );

    // Get total count
    const total = await Booking.countDocuments(filter);
    console.log("Total bookings count:", total);

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
    console.error("Get facility owner bookings error:", error);
    res.status(500).json({ error: "Server error while fetching bookings" });
  }
});

// @route   PUT /api/facilities/facility-owner/bookings/:bookingId/status
// @desc    Update booking status
// @access  Private (Facility owners only)
router.put(
  "/facility-owner/bookings/:bookingId/status",
  [
    auth,
    body("status")
      .isIn(["confirmed", "cancelled", "completed", "no_show"])
      .withMessage("Valid status is required"),
    body("notes").optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: errors.array() });
      }

      const { bookingId } = req.params;
      const { status, notes } = req.body;

      // Check if user is a facility owner
      if (req.user.role !== "facility_owner") {
        return res
          .status(403)
          .json({ error: "Access denied. Facility owners only." });
      }

      // Find the booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Check if the user owns the facility for this booking
      const facility = await Facility.findById(booking.facility);
      if (!facility || facility.owner.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "Access denied. You don't own this facility." });
      }

      // Update the booking
      booking.status = status;
      if (notes) {
        booking.notes = notes;
      }

      // Add status change timestamp
      if (status === "cancelled") {
        booking.cancelledBy = req.user._id;
        booking.cancelledAt = new Date();
      }

      await booking.save();

      // Populate references for response
      await booking.populate([
        { path: "user", select: "firstName lastName email" },
        { path: "facility", select: "name address" },
        { path: "sport", select: "name icon" },
      ]);

      res.json({
        message: "Booking status updated successfully",
        booking,
      });
    } catch (error) {
      console.error("Update booking status error:", error);
      res
        .status(500)
        .json({ error: "Server error while updating booking status" });
    }
  }
);

// @route   GET /api/facilities/:facilityId/blocked-slots
// @desc    Get all blocked time slots for a facility (Public)
// @access  Public
router.get("/:facilityId/blocked-slots", async (req, res) => {
  try {
    const { facilityId } = req.params;

    // Check if facility exists
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ error: "Facility not found" });
    }

    // Get all blocked time slots for this facility
    const blockedSlots = await BlockedTimeSlot.find({
      facility: facilityId,
      isActive: true,
    }).populate("court", "name");

    res.json({
      blockedSlots: blockedSlots.map((block) => ({
        id: block._id,
        court: block.court,
        date: block.date,
        startTime: block.startTime,
        endTime: block.endTime,
        reason: block.reason,
        createdAt: block.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get blocked slots error:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching blocked slots" });
  }
});

// @route   GET /api/facilities/facility-owner/:facilityId/blocked-slots
// @desc    Get all blocked time slots for a facility
// @access  Private (Facility owners only)
router.get(
  "/facility-owner/:facilityId/blocked-slots",
  [auth],
  async (req, res) => {
    try {
      const { facilityId } = req.params;

      // Check if user owns this facility
      const facility = await Facility.findById(facilityId);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }

      if (facility.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get all blocked time slots for this facility
      const blockedSlots = await BlockedTimeSlot.find({
        facility: facilityId,
        isActive: true,
      }).populate("court", "name");

      res.json({
        blockedSlots: blockedSlots.map((block) => ({
          id: block._id,
          court: block.court,
          date: block.date,
          startTime: block.startTime,
          endTime: block.endTime,
          reason: block.reason,
          createdAt: block.createdAt,
        })),
      });
    } catch (error) {
      console.error("Get blocked slots error:", error);
      res
        .status(500)
        .json({ error: "Server error while fetching blocked slots" });
    }
  }
);

// @route   GET /api/facilities/:facilityId/availability
// @desc    Get facility availability and blocked slots for a specific date (Public)
// @access  Public
router.get(
  "/:facilityId/availability",
  [query("date").isISO8601().withMessage("Valid date is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { date } = req.query;
      const { facilityId } = req.params;

      // Check if facility exists
      const facility = await Facility.findById(facilityId);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }

      // Get all bookings for the specified date
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const bookings = await Booking.find({
        facility: facilityId,
        date: { $gte: startOfDay, $lt: endOfDay },
        status: { $in: ["confirmed", "pending"] },
      }).populate("sport", "name icon");

      // Get blocked time slots for this date
      const blockedSlots = await BlockedTimeSlot.find({
        facility: facilityId,
        date: startOfDay,
        isActive: true,
      });

      // Structure the response
      const availability = {
        date,
        facility: {
          id: facility._id,
          name: facility.name,
          operatingHours: facility.operatingHours,
        },
        bookings: bookings.map((booking) => ({
          id: booking._id,
          court: booking.court.name,
          sport: booking.sport.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          user: booking.user,
        })),
        blockedSlots: blockedSlots.map((block) => ({
          id: block._id,
          court: block.court,
          startTime: block.startTime,
          endTime: block.endTime,
          reason: block.reason,
        })),
      };

      res.json(availability);
    } catch (error) {
      console.error("Get facility availability error:", error);
      res
        .status(500)
        .json({ error: "Server error while fetching availability" });
    }
  }
);

// @route   GET /api/facilities/facility-owner/:facilityId/availability
// @desc    Get facility availability and blocked slots for a specific date
// @access  Private (Facility owners only)
router.get(
  "/facility-owner/:facilityId/availability",
  [auth, query("date").isISO8601().withMessage("Valid date is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { date } = req.query;
      const { facilityId } = req.params;

      // Check if user owns this facility
      const facility = await Facility.findById(facilityId);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }

      if (facility.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get all bookings for the specified date
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const bookings = await Booking.find({
        facility: facilityId,
        date: { $gte: startOfDay, $lt: endOfDay },
        status: { $in: ["confirmed", "pending"] },
      }).populate("sport", "name icon");

      // Get blocked time slots for this date
      const blockedSlots = await BlockedTimeSlot.find({
        facility: facilityId,
        date: startOfDay,
      });

      // Structure the response
      const availability = {
        date,
        facility: {
          id: facility._id,
          name: facility.name,
          operatingHours: facility.operatingHours,
        },
        bookings: bookings.map((booking) => ({
          id: booking._id,
          court: booking.court.name,
          sport: booking.sport.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          user: booking.user,
        })),
        blockedSlots: blockedSlots.map((block) => ({
          id: block._id,
          court: block.court,
          startTime: block.startTime,
          endTime: block.endTime,
          reason: block.reason,
        })),
      };

      res.json(availability);
    } catch (error) {
      console.error("Get facility availability error:", error);
      res
        .status(500)
        .json({ error: "Server error while fetching availability" });
    }
  }
);

// @route   POST /api/facilities/facility-owner/:facilityId/courts/:courtId/block
// @desc    Block a time slot for a specific court
// @access  Private (Facility owners only)
router.post(
  "/facility-owner/:facilityId/courts/:courtId/block",
  [
    auth,
    body("date").isISO8601().withMessage("Valid date is required"),
    body("startTime")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Valid start time is required (HH:MM)"),
    body("endTime")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Valid end time is required (HH:MM)"),
    body("reason").optional().trim().isLength({ max: 200 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { facilityId, courtId } = req.params;
      const { date, startTime, endTime, reason } = req.body;

      // Check if user owns this facility
      const facility = await Facility.findById(facilityId);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }

      if (facility.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Check if court exists in this facility and get court name
      let courtName = null;
      const courtExists = facility.sports.some((sport) =>
        sport.courts.some((court) => {
          if (court._id.toString() === courtId) {
            courtName = court.name;
            return true;
          }
          return false;
        })
      );

      if (!courtExists) {
        return res
          .status(404)
          .json({ error: "Court not found in this facility" });
      }

      // Check for booking conflicts
      const conflictingBooking = await Booking.findOne({
        facility: facilityId,
        "court.name": courtName,
        date: new Date(date),
        status: { $in: ["confirmed", "pending"] },
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
          },
        ],
      });

      // Check for existing blocked slots conflicts
      const conflictingBlock = await BlockedTimeSlot.findOne({
        facility: facilityId,
        court: courtId,
        date: new Date(date),
        isActive: true,
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
          },
        ],
      });

      if (conflictingBlock) {
        return res.status(400).json({
          error: "Time slot conflicts with existing blocked slot",
          details: `Court is already blocked from ${conflictingBlock.startTime} to ${conflictingBlock.endTime}`,
        });
      }

      if (conflictingBooking) {
        return res.status(400).json({
          error: "Time slot conflicts with existing booking",
          details: `Court is already booked from ${conflictingBooking.startTime} to ${conflictingBooking.endTime}`,
        });
      }

      // Create blocked time slot
      const blockedSlot = new BlockedTimeSlot({
        facility: facilityId,
        court: courtId,
        date: new Date(date),
        startTime,
        endTime,
        reason: reason || "",
        blockedBy: req.user._id,
      });

      await blockedSlot.save();

      res.status(201).json({
        message: "Time slot blocked successfully",
        blockedSlot,
      });
    } catch (error) {
      console.error("Block time slot error:", error);
      res.status(500).json({ error: "Server error while blocking time slot" });
    }
  }
);

// @route   DELETE /api/facilities/facility-owner/:facilityId/courts/:courtId/unblock/:blockId
// @desc    Unblock a time slot
// @access  Private (Facility owners only)
router.delete(
  "/facility-owner/:facilityId/courts/:courtId/unblock/:blockId",
  [auth],
  async (req, res) => {
    try {
      const { facilityId, courtId, blockId } = req.params;

      // Check if user owns this facility
      const facility = await Facility.findById(facilityId);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }

      if (facility.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Delete the blocked time slot
      const blockedSlot = await BlockedTimeSlot.findById(blockId);

      if (!blockedSlot) {
        return res.status(404).json({ error: "Blocked time slot not found" });
      }

      if (blockedSlot.facility.toString() !== facilityId) {
        return res
          .status(400)
          .json({ error: "Invalid facility for this blocked slot" });
      }

      await BlockedTimeSlot.findByIdAndDelete(blockId);

      res.json({ message: "Time slot unblocked successfully" });
    } catch (error) {
      console.error("Unblock time slot error:", error);
      res
        .status(500)
        .json({ error: "Server error while unblocking time slot" });
    }
  }
);

module.exports = router;
