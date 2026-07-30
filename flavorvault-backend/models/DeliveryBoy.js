const mongoose = require("mongoose");

const deliveryBoySchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  vehicle: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    default: "Available"
  },

  location: {
    lat: {
      type: Number,
      default: 0
    },
    lng: {
      type: Number,
      default: 0
    }
  },

  // UPI ID this delivery boy uses to receive payments via QR code
  // (e.g. "name@okhdfcbank"). Set by admin when adding/editing.
  upiId: {
    type: String,
    default: ""
  }

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "DeliveryBoy",
  deliveryBoySchema
);
