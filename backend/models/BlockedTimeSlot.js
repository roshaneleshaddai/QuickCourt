const mongoose = require("mongoose");

const blockedTimeSlotSchema = new mongoose.Schema(
  {
    facility: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: true,
    },
    court: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
blockedTimeSlotSchema.index({ facility: 1, date: 1, court: 1 });
blockedTimeSlotSchema.index({ date: 1, startTime: 1, endTime: 1 });

// Virtual for duration in hours
blockedTimeSlotSchema.virtual("duration").get(function () {
  const start = new Date(`2000-01-01 ${this.startTime}`);
  const end = new Date(`2000-01-01 ${this.endTime}`);
  return (end - start) / (1000 * 60 * 60); // Convert to hours
});

// Method to check if a time slot conflicts with this blocked slot
blockedTimeSlotSchema.methods.conflictsWith = function (startTime, endTime) {
  const blockStart = new Date(`2000-01-01 ${this.startTime}`);
  const blockEnd = new Date(`2000-01-01 ${this.endTime}`);
  const slotStart = new Date(`2000-01-01 ${startTime}`);
  const slotEnd = new Date(`2000-01-01 ${endTime}`);

  return (
    (slotStart >= blockStart && slotStart < blockEnd) ||
    (slotEnd > blockStart && slotEnd <= blockEnd) ||
    (slotStart <= blockStart && slotEnd >= blockEnd)
  );
};

// Static method to find conflicting blocked slots
blockedTimeSlotSchema.statics.findConflicts = function (
  facilityId,
  courtId,
  date,
  startTime,
  endTime
) {
  return this.find({
    facility: facilityId,
    court: courtId,
    date: date,
    isActive: true,
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      },
    ],
  });
};

// Pre-save middleware to validate time logic
blockedTimeSlotSchema.pre("save", function (next) {
  const start = new Date(`2000-01-01 ${this.startTime}`);
  const end = new Date(`2000-01-01 ${this.endTime}`);

  if (start >= end) {
    return next(new Error("Start time must be before end time"));
  }

  // Check if the time range is reasonable (e.g., not more than 24 hours)
  const duration = (end - start) / (1000 * 60 * 60);
  if (duration > 24) {
    return next(new Error("Blocked time slot cannot exceed 24 hours"));
  }

  next();
});

module.exports = mongoose.model("BlockedTimeSlot", blockedTimeSlotSchema);
