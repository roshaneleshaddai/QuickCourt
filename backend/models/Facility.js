const mongoose = require("mongoose");

const facilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Facility name is required"],
      trim: true,
      maxlength: [100, "Facility name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    address: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      zipCode: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    contactInfo: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      website: { type: String, trim: true },
    },
    sports: [
      {
        sport: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Sport",
          required: true,
        },
        courts: [
          {
            name: { type: String, required: true, trim: true },
            type: {
              type: String,
              enum: ["indoor", "outdoor"],
              default: "indoor",
            },
            surface: { type: String, trim: true },
            capacity: { type: Number, default: 2 },
            hourlyRate: { type: Number, required: true, min: 0 },
            isActive: { type: Boolean, default: true },
            amenities: [{ type: String, trim: true }],
            images: [{ type: String }],
          },
        ],
      },
    ],
    amenities: [
      {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        icon: { type: String },
      },
    ],
    operatingHours: {
      monday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true },
      },
      tuesday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true },
      },
      wednesday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true },
      },
      thursday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true },
      },
      friday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true },
      },
      saturday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true },
      },
      sunday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true },
      },
    },
    images: [{ type: String }],
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [500, "Admin notes cannot exceed 500 characters"],
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    policies: {
      cancellationPolicy: { type: String, trim: true },
      bookingAdvance: { type: Number, default: 7, min: 0 }, // days in advance
      maxBookingDuration: { type: Number, default: 4, min: 1 }, // hours
      minBookingDuration: { type: Number, default: 1, min: 0.5 }, // hours
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
facilitySchema.index({ location: "2dsphere" });

// Index for search functionality
facilitySchema.index({ name: "text", description: "text" });

// Virtual for total courts count
facilitySchema.virtual("totalCourts").get(function () {
  return this.sports.reduce((total, sport) => total + sport.courts.length, 0);
});

// Method to check if facility is open on a specific day and time
facilitySchema.methods.isOpen = function (day, time) {
  const daySchedule = this.operatingHours[day.toLowerCase()];
  if (!daySchedule || !daySchedule.isOpen) return false;

  if (!daySchedule.open || !daySchedule.close) return true;

  const currentTime = new Date(`2000-01-01 ${time}`);
  const openTime = new Date(`2000-01-01 ${daySchedule.open}`);
  const closeTime = new Date(`2000-01-01 ${daySchedule.close}`);

  return currentTime >= openTime && currentTime <= closeTime;
};

module.exports = mongoose.model("Facility", facilitySchema);
