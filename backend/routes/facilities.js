const express = require("express");
const { body, query, validationResult } = require("express-validator");
const Facility = require("../models/Facility");
const { auth, optionalAuth, authorize } = require("../middleware/auth");

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

module.exports = router;
