const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true
    },

    // This was missing entirely, which meant every username typed at sign-up
    // was silently discarded by Mongoose (it drops any field not declared in
    // the schema) - so there was never anything in the database to match
    // against, and logging in with a username could never work.
    username: {
        type: String,
        unique: true,
        sparse: true // allows many users to have no username without unique-index conflicts
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
