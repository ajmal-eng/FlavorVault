require("dotenv").config();
const mongoose = require("mongoose");
const Food = require("../models/Food"); // adjust to your actual model name/path

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const foods = await Food.find({ image: /127\.0\.0\.1/ });
  for (const food of foods) {
    food.image = food.image.replace(/^https?:\/\/127\.0\.0\.1:5000/, "");
    await food.save();
    console.log(`Fixed: ${food.name}`);
  }
  console.log(`Done. Fixed ${foods.length} item(s).`);
  process.exit(0);
}

run();