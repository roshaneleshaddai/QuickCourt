const express = require("express");
const cloudinary = require("../config/cloudinary");
const {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
} = require("../middleware/upload");
const { auth, authorize } = require("../middleware/auth");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @route   POST /api/upload/single
// @desc    Upload single image to Cloudinary
// @access  Private (Authenticated users)
router.post("/single", auth, uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    console.log("Uploading single image:", req.file.filename);
    console.log("File path:", req.file.path);
    console.log("File exists:", fs.existsSync(req.file.path));

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "sports-facilities",
      transformation: [
        { width: 800, height: 600, crop: "fill", quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    // Delete temporary file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      image: {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
      },
    });
  } catch (error) {
    console.error("Single image upload error:", error);

    // Clean up temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res
      .status(500)
      .json({ error: "Failed to upload image", details: error.message });
  }
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple images to Cloudinary
// @access  Private (Authenticated users)
router.post("/multiple", auth, uploadMultiple, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image files provided" });
    }

    console.log(`Uploading ${req.files.length} images`);

    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "sports-facilities",
          transformation: [
            { width: 800, height: 600, crop: "fill", quality: "auto" },
            { fetch_format: "auto" },
          ],
        });

        // Delete temporary file
        fs.unlinkSync(file.path);

        return {
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          size: result.bytes,
        };
      } catch (uploadError) {
        console.error(`Error uploading ${file.filename}:`, uploadError);
        // Clean up temporary file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw uploadError;
      }
    });

    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      images: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Multiple images upload error:", error);

    // Clean up any remaining temporary files
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({ error: "Failed to upload images" });
  }
});

// @route   DELETE /api/upload/:public_id
// @desc    Delete image from Cloudinary
// @access  Private (Authenticated users)
router.delete("/:public_id", auth, async (req, res) => {
  try {
    const { public_id } = req.params;

    console.log("Deleting image:", public_id);

    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === "ok") {
      res.json({ success: true, message: "Image deleted successfully" });
    } else {
      res.status(400).json({ error: "Failed to delete image" });
    }
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

// @route   POST /api/upload/transform
// @desc    Transform image URL with Cloudinary transformations
// @desc    This is useful for generating different sizes/versions of images
// @access  Public
router.post("/transform", async (req, res) => {
  try {
    const { imageUrl, transformations } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required" });
    }

    // Default transformations
    const defaultTransformations = {
      width: 400,
      height: 300,
      crop: "fill",
      quality: "auto",
      fetch_format: "auto",
    };

    // Merge with user-provided transformations
    const finalTransformations = {
      ...defaultTransformations,
      ...transformations,
    };

    // Generate transformed URL
    const transformedUrl = cloudinary.url(imageUrl, {
      transformation: [finalTransformations],
    });

    res.json({
      success: true,
      originalUrl: imageUrl,
      transformedUrl: transformedUrl,
      transformations: finalTransformations,
    });
  } catch (error) {
    console.error("Transform image error:", error);
    res.status(500).json({ error: "Failed to transform image" });
  }
});

// Error handling middleware
router.use(handleUploadError);

module.exports = router;
