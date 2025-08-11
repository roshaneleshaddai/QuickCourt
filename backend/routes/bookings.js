const express = require("express");
const { body, query, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const Facility = require("../models/Facility");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post(
  "/",
  [
    auth,
    body("facility").isMongoId().withMessage("Valid facility ID is required"),
    body("sport").isMongoId().withMessage("Valid sport ID is required"),
    body("court.name").trim().notEmpty().withMessage("Court name is required"),
    body("date").isISO8601().withMessage("Valid date is required"),
    body("startTime")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Valid start time is required (HH:MM)"),
    body("duration")
      .isFloat({ min: 0.5, max: 8 })
      .withMessage("Duration must be between 0.5 and 8 hours"),
    body("players").optional().isArray(),
    body("specialRequests").optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        facility: facilityId,
        sport: sportId,
        court,
        date,
        startTime,
        duration,
        players = [],
        specialRequests,
      } = req.body;

      // Check if facility exists and is active
      const facility = await Facility.findById(facilityId);
      if (!facility || !facility.isActive) {
        return res.status(404).json({ error: "Facility not found" });
      }

      // Check if sport is available at this facility
      const sportAvailable = facility.sports.some(
        (s) => s.sport.toString() === sportId
      );
      if (!sportAvailable) {
        return res
          .status(400)
          .json({ error: "Sport not available at this facility" });
      }

      // Check if court exists at this facility
      const courtExists = facility.sports.some(
        (s) =>
          s.sport.toString() === sportId &&
          s.courts.some((c) => c.name === court.name && c.isActive)
      );
      if (!courtExists) {
        return res.status(400).json({ error: "Court not found or inactive" });
      }

      // Check if facility is open on the booking date
      const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
        weekday: "lowercase",
      });
      if (!facility.operatingHours[dayOfWeek]?.isOpen) {
        return res
          .status(400)
          .json({ error: "Facility is closed on this day" });
      }

      // Check for booking conflicts
      const endTime = new Date(`2000-01-01 ${startTime}`);
      endTime.setHours(endTime.getHours() + duration);
      const endTimeString = endTime.toTimeString().slice(0, 5);

      const conflictingBooking = await Booking.findOne({
        facility: facilityId,
        "court.name": court.name,
        date: new Date(date),
        status: { $in: ["confirmed", "pending"] },
        $or: [
          {
            startTime: { $lt: endTimeString },
            endTime: { $gt: startTime },
          },
        ],
      });

      if (conflictingBooking) {
        return res.status(400).json({ error: "Time slot is not available" });
      }

      // Calculate total amount
      const sportInfo = facility.sports.find(
        (s) => s.sport.toString() === sportId
      );
      const courtInfo = sportInfo.courts.find((c) => c.name === court.name);
      const totalAmount = courtInfo.hourlyRate * duration;

      // Create booking
      const booking = new Booking({
        user: req.user._id,
        facility: facilityId,
        sport: sportId,
        court: {
          name: court.name,
          type: courtInfo.type,
        },
        date: new Date(date),
        startTime,
        endTime: endTimeString,
        duration,
        totalAmount,
        players,
        specialRequests,
      });

      await booking.save();

      // Populate references for response
      await booking.populate([
        { path: "facility", select: "name address images" },
        { path: "sport", select: "name icon" },
      ]);

      res.status(201).json({
        message: "Booking created successfully",
        booking,
      });
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({ error: "Server error while creating booking" });
    }
  }
);

// @route   GET /api/bookings
// @desc    Get all bookings (admin/facility owner) or user's bookings
// @access  Private
router.get("/", [auth], async (req, res) => {
  try {
    const { page = 1, limit = 10, status, facility, date } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};

    // Regular users can only see their own bookings
    if (req.user.role === "user") {
      filter.user = req.user._id;
    }

    // Facility owners can see bookings for their facilities
    if (req.user.role === "facility_owner") {
      const userFacilities = await Facility.find({
        owner: req.user._id,
      }).select("_id");
      filter.facility = { $in: userFacilities.map((f) => f._id) };
    }

    if (status) filter.status = status;
    if (facility) filter.facility = facility;
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      filter.date = { $gte: startOfDay, $lt: endOfDay };
    }

    const bookings = await Booking.find(filter)
      .populate("user", "firstName lastName email")
      .populate("facility", "name address images")
      .populate("sport", "name icon")
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

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
    console.error("Get bookings error:", error);
    res.status(500).json({ error: "Server error while fetching bookings" });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "firstName lastName email")
      .populate("facility", "name address images")
      .populate("sport", "name icon");

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if user can access this booking
    if (
      req.user.role === "user" &&
      booking.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (req.user.role === "facility_owner") {
      const facility = await Facility.findById(booking.facility);
      if (facility.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    res.json(booking);
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({ error: "Server error while fetching booking" });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking
// @access  Private
router.put(
  "/:id",
  [
    auth,
    body("status")
      .optional()
      .isIn(["confirmed", "cancelled", "completed", "no_show"]),
    body("notes").optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Check if user can update this booking
      if (
        req.user.role === "user" &&
        booking.user.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (req.user.role === "facility_owner") {
        const facility = await Facility.findById(booking.facility);
        if (facility.owner.toString() !== req.user._id.toString()) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Handle status changes
      if (
        req.body.status === "cancelled" &&
        req.body.status !== booking.status
      ) {
        req.body.cancelledBy = req.user._id;
        req.body.cancelledAt = new Date();

        // Calculate refund amount based on cancellation policy
        const facility = await Facility.findById(booking.facility);
        const hoursUntilBooking =
          (new Date(booking.date) - new Date()) / (1000 * 60 * 60);

        if (hoursUntilBooking >= 24) {
          req.body.refundAmount = booking.totalAmount;
        } else {
          req.body.refundAmount = 0;
        }
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate([
        { path: "user", select: "firstName lastName email" },
        { path: "facility", select: "name address images" },
        { path: "sport", select: "name icon" },
      ]);

      res.json({
        message: "Booking updated successfully",
        booking: updatedBooking,
      });
    } catch (error) {
      console.error("Update booking error:", error);
      res.status(500).json({ error: "Server error while updating booking" });
    }
  }
);

// @route   DELETE /api/bookings/:id
// @desc    Cancel booking (soft delete)
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if user can cancel this booking
    if (
      req.user.role === "user" &&
      booking.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (req.user.role === "facility_owner") {
      const facility = await Facility.findById(booking.facility);
      if (facility.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      return res
        .status(400)
        .json({ error: "Booking cannot be cancelled within 24 hours" });
    }

    // Cancel the booking
    booking.status = "cancelled";
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
    await booking.save();

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ error: "Server error while cancelling booking" });
  }
});

// @route   GET /api/bookings/facility/:facilityId/availability
// @desc    Get facility availability for a specific date
// @access  Public
router.get(
  "/facility/:facilityId/availability",
  [query("date").isISO8601().withMessage("Valid date is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { date } = req.query;
      const { facilityId } = req.params;

      const facility = await Facility.findById(facilityId);
      if (!facility || !facility.isActive) {
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
      });

      // Generate available time slots
      const availableSlots = [];
      const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
        weekday: "lowercase",
      });
      const operatingHours = facility.operatingHours[dayOfWeek];

      if (operatingHours && operatingHours.isOpen) {
        // Generate time slots from opening to closing time
        // This is a simplified version - you'd want more sophisticated logic
        availableSlots.push({
          message: "Available time slots calculation not yet implemented",
          operatingHours: operatingHours,
        });
      }

      res.json({
        facility: facility.name,
        date,
        availableSlots,
        existingBookings: bookings.length,
      });
    } catch (error) {
      console.error("Check availability error:", error);
      res
        .status(500)
        .json({ error: "Server error while checking availability" });
    }
  }
);

module.exports = router;
