const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

  customerName: {
    type: String,
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  phone: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: true
  },

  items: [
    {
      foodId: String,
      name: String,
      price: Number,
      quantity: Number
    }
  ],

  totalAmount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    default: "pending"
  },

  deliveryBoyId: {
    type: String,
    default: null
  },

  deliveryBoyName: {
    type: String,
    default: ""
  },

  paymentMethod: {
    type: String,
    default: "COD"
  },

  paymentStatus: {
    type: String,
    default: "Pending"
  },

  couponCode: {
    type: String,
    default: ""
  },

  discount: {
    type: Number,
    default: 0
  },

  // 'percent' or 'fixed'
  discountType: {
    type: String,
    enum: ['percent','fixed'],
    default: 'percent'
  },

  subtotal: {
    type: Number,
    default: 0
  },

  // Kitchen workflow - separate from `status` (which admin/delivery use).
  // false = still needs to be prepared by the chef; true = chef marked it
  // done. This never deletes the order, it just removes it from the chef's
  // queue.
  prepared: {
    type: Boolean,
    default: false
  },

  // Food IDs from this order that the user has already submitted a rating
  // for - prevents rating the same order's item twice.
  ratedFoodIds: {
    type: [String],
    default: []
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Order", orderSchema);
