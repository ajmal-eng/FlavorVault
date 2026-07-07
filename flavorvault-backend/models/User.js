const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
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
        type: String
    },

    address: {
        type: String
    },

    role: {
        type: String,
        default: "user"
    },

    points: {
        type: Number,
        default: 0
    },

    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },

    referredBy: {
        type: String,
        default: ""
    },

    redeemedRewards: [
      {
        rewardId: String,
        rewardName: String,
        pointsCost: Number,
        redeemedAt: { type: Date, default: Date.now }
      }
    ],

    resetCode: {
        type: String
    },

    resetCodeExpires: {
        type: Date
    }
},
{
  timestamps: true
}
);

module.exports = mongoose.model("User", userSchema);
