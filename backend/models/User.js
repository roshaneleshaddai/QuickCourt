const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    phoneNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v || v.trim() === "") return true; // Allow empty strings
          return /^[\+]?[1-9][\d]{0,15}$/.test(v);
        },
        message: "Please enter a valid phone number",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "facility_owner"],
      default: "user",
    },
    profilePicture: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [500, "Admin notes cannot exceed 500 characters"],
    },
    statusUpdatedAt: {
      type: Date,
    },
    statusUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    preferences: {
      favoriteSports: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Sport",
        },
      ],
      favoriteFacilities: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Facility",
        },
      ],
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Initialize preferences if they don't exist
userSchema.pre("save", function (next) {
  if (!this.preferences) {
    this.preferences = {
      favoriteSports: [],
      favoriteFacilities: [],
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
    };
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user profile (without password)
userSchema.methods.getProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Virtual for dateJoined (since we have timestamps)
userSchema.virtual("dateJoined").get(function () {
  return this.createdAt;
});

// Virtual for user stats (these would typically come from related collections)
userSchema.virtual("stats").get(function () {
  return {
    totalBookings: 0, // This would be populated from Bookings collection
    totalHoursPlayed: 0, // This would be calculated from Bookings
    mostPlayedSport: "Not set", // This would be calculated from Bookings
    favoriteTime: "Not set", // This would be calculated from Bookings
  };
});

// Ensure virtual fields are serialized
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
