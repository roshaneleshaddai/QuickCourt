const mongoose = require("mongoose");

const sportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Sport name is required"],
      unique: true,
      trim: true,
      maxlength: [50, "Sport name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    icon: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      enum: ["indoor", "outdoor", "both"],
      default: "indoor",
    },
    equipment: [
      {
        type: String,
        trim: true,
      },
    ],
    maxPlayers: {
      type: Number,
      default: 2,
    },
    minPlayers: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    popularity: {
      type: Number,
      default: 0,
      min: 0,
    },
    rules: [
      {
        type: String,
        trim: true,
      },
    ],
    facilities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Facility",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for search functionality
sportSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Sport", sportSchema);
