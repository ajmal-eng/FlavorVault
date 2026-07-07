const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  // For percentage coupons, set `type: 'percent'` and `discount`.
  // For fixed-amount coupons, set `type: 'fixed'` and `amount`.
  type: {
    type: String,
    enum: ['percent', 'fixed'],
    default: 'percent'
  },

  // percentage value (1-100)
  discount: {
    type: Number,
    default: 0
  },

  // fixed amount in currency (e.g., 5 for $5 off)
  amount: {
    type: Number,
    default: 0
  },

  active: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("Coupon", couponSchema);
