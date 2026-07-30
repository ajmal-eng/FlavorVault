// Run once after deploying the new points rate, to rescale existing
// customers' point balances so they match the new system (1 point per
// ₹1000 spent, instead of the old 1 point per ₹1 spent).
// Usage: node scripts/migrate_points_rescale.js

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const users = await User.find({ points: { $gt: 0 } });
  console.log(`Found ${users.length} users with points to rescale`);

  for (const user of users) {
    const oldPoints = user.points;
    const newPoints = Math.floor(oldPoints / 1000);
    user.points = newPoints;
    await user.save();
    console.log(`${user.email}: ${oldPoints} -> ${newPoints}`);
  }

  console.log("Done.");
  await mongoose.disconnect();
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
