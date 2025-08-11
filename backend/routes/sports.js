const express = require("express");
const { body, validationResult } = require("express-validator");
const Sport = require("../models/Sport");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/sports
// @desc    Get all sports
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const sports = await Sport.find(filter)
      .sort({ popularity: -1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sport.countDocuments(filter);

    res.json({
      sports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get sports error:", error);
    res.status(500).json({ error: "Server error while fetching sports" });
  }
});

// @route   GET /api/sports/categories
// @desc    Get all sport categories
// @access  Public
router.get("/categories", async (req, res) => {
  try {
    const categories = await Sport.distinct("category");
    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Server error while fetching categories" });
  }
});

// @route   GET /api/sports/:id
// @desc    Get sport by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const sport = await Sport.findById(req.params.id);

    if (!sport || !sport.isActive) {
      return res.status(404).json({ error: "Sport not found" });
    }

    res.json(sport);
  } catch (error) {
    console.error("Get sport error:", error);
    res.status(500).json({ error: "Server error while fetching sport" });
  }
});

// @route   POST /api/sports
// @desc    Create a new sport
// @access  Private (Admin only)
router.post(
  "/",
  [
    auth,
    authorize("admin"),
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Sport name must be between 2 and 50 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),
    body("category")
      .optional()
      .isIn(["indoor", "outdoor", "both"])
      .withMessage("Category must be indoor, outdoor, or both"),
    body("maxPlayers")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Max players must be at least 1"),
    body("minPlayers")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Min players must be at least 1"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const sport = new Sport(req.body);
      await sport.save();

      res.status(201).json({
        message: "Sport created successfully",
        sport,
      });
    } catch (error) {
      console.error("Create sport error:", error);
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ error: "Sport with this name already exists" });
      }
      res.status(500).json({ error: "Server error while creating sport" });
    }
  }
);

// @route   PUT /api/sports/:id
// @desc    Update sport
// @access  Private (Admin only)
router.put(
  "/:id",
  [
    auth,
    authorize("admin"),
    body("name").optional().trim().isLength({ min: 2, max: 50 }),
    body("description").optional().trim().isLength({ max: 500 }),
    body("category").optional().isIn(["indoor", "outdoor", "both"]),
    body("maxPlayers").optional().isInt({ min: 1 }),
    body("minPlayers").optional().isInt({ min: 1 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const sport = await Sport.findById(req.params.id);

      if (!sport) {
        return res.status(404).json({ error: "Sport not found" });
      }

      const updatedSport = await Sport.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      res.json({
        message: "Sport updated successfully",
        sport: updatedSport,
      });
    } catch (error) {
      console.error("Update sport error:", error);
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ error: "Sport with this name already exists" });
      }
      res.status(500).json({ error: "Server error while updating sport" });
    }
  }
);

// @route   DELETE /api/sports/:id
// @desc    Delete sport
// @access  Private (Admin only)
router.delete("/:id", [auth, authorize("admin")], async (req, res) => {
  try {
    const sport = await Sport.findById(req.params.id);

    if (!sport) {
      return res.status(404).json({ error: "Sport not found" });
    }

    // Soft delete - mark as inactive
    sport.isActive = false;
    await sport.save();

    res.json({ message: "Sport deleted successfully" });
  } catch (error) {
    console.error("Delete sport error:", error);
    res.status(500).json({ error: "Server error while deleting sport" });
  }
});

// @route   PUT /api/sports/:id/popularity
// @desc    Update sport popularity
// @access  Private
router.put("/:id/popularity", auth, async (req, res) => {
  try {
    const { increment } = req.body;

    if (typeof increment !== "number") {
      return res.status(400).json({ error: "Increment must be a number" });
    }

    const sport = await Sport.findById(req.params.id);

    if (!sport) {
      return res.status(404).json({ error: "Sport not found" });
    }

    sport.popularity = Math.max(0, sport.popularity + increment);
    await sport.save();

    res.json({
      message: "Popularity updated successfully",
      popularity: sport.popularity,
    });
  } catch (error) {
    console.error("Update popularity error:", error);
    res.status(500).json({ error: "Server error while updating popularity" });
  }
});

module.exports = router;
