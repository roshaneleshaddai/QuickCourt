const express = require("express");
const mongoose = require("mongoose");
const { body, param, validationResult } = require("express-validator");
const Review = require("../models/Review");
const Facility = require("../models/Facility");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Health check for reviews routes
router.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Review routes are working",
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/reviews/facility/:facilityId
// @desc    Get all reviews for a facility
// @access  Public
router.get("/facility/:facilityId", async (req, res) => {
  try {
    const { facilityId } = req.params;
    console.log("Fetching reviews for facility:", facilityId);
    
    // Validate facility ID
    if (!mongoose.Types.ObjectId.isValid(facilityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid facility ID",
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get reviews with user information
    const reviews = await Review.find({ facility: facilityId })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`Found ${reviews.length} reviews for facility ${facilityId}`);

    // Get total count for pagination
    const totalReviews = await Review.countDocuments({ facility: facilityId });

    // Calculate simple average rating
    let averageRating = 0;
    let totalCount = reviews.length;
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / reviews.length;
    }

    // Get all reviews for complete rating calculation
    if (totalReviews > reviews.length) {
      const allReviews = await Review.find({ facility: facilityId }).select('rating');
      const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0;
      totalCount = allReviews.length;
    }

    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        limit,
      },
      rating: {
        average: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        count: totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    console.log("Creating review with data:", req.body);
    console.log("User:", req.user);

    const { facility, rating, comment } = req.body;

    // Basic validation
    if (!facility) {
      return res.status(400).json({
        success: false,
        message: "Facility ID is required",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (!comment || comment.trim().length < 10 || comment.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Comment must be between 10 and 500 characters",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(facility)) {
      return res.status(400).json({
        success: false,
        message: "Invalid facility ID",
      });
    }

    const userId = req.user._id || req.user.id;

    // Check if facility exists
    const facilityExists = await Facility.findById(facility);
    if (!facilityExists) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    // Check if user already reviewed this facility
    const existingReview = await Review.findOne({
      user: userId,
      facility: facility,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this facility",
      });
    }

    // Create new review
    const review = new Review({
      user: userId,
      facility,
      rating: parseInt(rating),
      comment: comment.trim(),
    });

    await review.save();
    console.log("Review created successfully:", review);

    // Populate user information for response
    await review.populate("user", "firstName lastName email");

    // Update facility rating
    await updateFacilityRating(facility);

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message,
    });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update user's own review
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    console.log("Updating review:", req.params.id, "with data:", req.body);

    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id || req.user.id;

    // Validate review ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Validate comment if provided
    if (comment !== undefined && (comment.trim().length < 10 || comment.trim().length > 500)) {
      return res.status(400).json({
        success: false,
        message: "Comment must be between 10 and 500 characters",
      });
    }

    // Find review and check ownership
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own reviews",
      });
    }

    // Update review
    if (rating !== undefined) review.rating = parseInt(rating);
    if (comment !== undefined) review.comment = comment.trim();

    await review.save();
    console.log("Review updated successfully:", review);

    await review.populate("user", "firstName lastName email");

    // Update facility rating
    await updateFacilityRating(review.facility);

    res.json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete user's own review
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    console.log("Deleting review:", req.params.id);

    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    // Validate review ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    // Find review and check ownership
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews",
      });
    }

    const facilityId = review.facility;
    await Review.findByIdAndDelete(id);
    console.log("Review deleted successfully");

    // Update facility rating after deletion
    await updateFacilityRating(facilityId);

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
});

// Helper function to update facility rating
async function updateFacilityRating(facilityId) {
  try {
    console.log("Updating facility rating for:", facilityId);
    
    // Get all reviews for this facility
    const reviews = await Review.find({ facility: facilityId }).select('rating');
    
    let averageRating = 0;
    const totalCount = reviews.length;
    
    if (totalCount > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / totalCount;
    }

    console.log(`Updating facility ${facilityId} - Average: ${averageRating}, Count: ${totalCount}`);

    await Facility.findByIdAndUpdate(facilityId, {
      "rating.average": Math.round(averageRating * 10) / 10,
      "rating.count": totalCount,
    });
    
    console.log("Facility rating updated successfully");
  } catch (error) {
    console.error("Error updating facility rating:", error);
  }
}

module.exports = router;
