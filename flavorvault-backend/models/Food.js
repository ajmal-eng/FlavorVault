const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  category: {
    type: String,
    required: true
  },

  badge: {
    type: String,
    default: ""
  },

  image: {
    type: String,
    default: ""
  },

  description: {
    type: String,
    default: ""
  },

  available: {
    type: Boolean,
    default: true
  },

  // Only one food should have this true at a time - shown in the
  // "Trending Now" hero card on the user site homepage.
  trending: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Food", foodSchema);