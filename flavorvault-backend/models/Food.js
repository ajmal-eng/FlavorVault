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
  },

  // Real ratings submitted by users after ordering this item. We store the
  // running sum and count (rather than an array of every rating) so
  // computing the average is a cheap O(1) read instead of pulling every
  // rating document every time the menu loads.
  ratingSum: {
    type: Number,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Food", foodSchema);