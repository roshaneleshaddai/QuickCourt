const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    facility: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: true,
    },
    sport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
    },
    court: {
      name: { type: String, required: true },
      type: { type: String, enum: ["indoor", "outdoor"] },
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 0.5,
      max: 8,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "no_show"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal", "cash", "online"],
    },
    paymentId: {
      type: String,
    },
    players: [
      {
        name: { type: String, required: true, trim: true },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, trim: true },
      },
    ],
    specialRequests: {
      type: String,
      trim: true,
      maxlength: [500, "Special requests cannot exceed 500 characters"],
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancelledAt: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      frequency: { type: String, enum: ["weekly", "biweekly", "monthly"] },
      endDate: { type: Date },
      occurrences: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
bookingSchema.index({ user: 1, date: 1 });
bookingSchema.index({ facility: 1, date: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ status: 1, date: 1 });

// Virtual for end time calculation
bookingSchema.virtual("calculatedEndTime").get(function () {
  if (!this.startTime || !this.duration) return null;

  const start = new Date(`2000-01-01 ${this.startTime}`);
  const end = new Date(start.getTime() + this.duration * 60 * 60 * 1000);

  return end.toTimeString().slice(0, 5);
});

// Method to check if booking conflicts with another
bookingSchema.methods.hasConflict = function (otherBooking) {
  if (this.facility.toString() !== otherBooking.facility.toString())
    return false;
  if (this.court.name !== otherBooking.court.name) return false;
  if (this.date.toDateString() !== otherBooking.date.toDateString())
    return false;

  const thisStart = new Date(`2000-01-01 ${this.startTime}`);
  const thisEnd = new Date(`2000-01-01 ${this.endTime}`);
  const otherStart = new Date(`2000-01-01 ${otherBooking.startTime}`);
  const otherEnd = new Date(`2000-01-01 ${otherBooking.endTime}`);

  return thisStart < otherEnd && thisEnd > otherStart;
};

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function () {
  const now = new Date();
  const bookingDate = new Date(this.date);
  const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);

  return this.status === "confirmed" && hoursUntilBooking >= 24;
};

// Pre-save middleware to validate end time
bookingSchema.pre("save", function (next) {
  if (this.startTime && this.duration) {
    this.endTime = this.calculatedEndTime;
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
