const Food = require("../models/Food");

const addFood = async (req, res) => {
  try {
    console.log("FOOD BODY:", req.body);

    const { name, price, category, image, description, badge, trending } = req.body;

    if (trending === true) {
      await Food.updateMany({}, { $set: { trending: false } });
    }

    const food = await Food.create({
      name,
      price,
      category,
      image,
      description,
      badge,
      trending: !!trending
    });

    console.log("FOOD SAVED:", food);

    res.status(201).json({
      success: true,
      food
    });

  } catch (error) {
    console.error("ADD FOOD ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
};

const getFoods = async (req, res) => {
  try {
    const foods = await Food.find();

    res.json({
      success: true,
      foods
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const deleteFood = async (req, res) => {
  try {
    const { id } = req.params;

    await Food.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Food deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const updateFood = async (req, res) => {
  try {
    const { id } = req.params;

    // Only one food should be "trending" at a time (shown on the homepage
    // hero card), so unset it on every other food first if this one is
    // being marked trending.
    if (req.body.trending === true) {
      await Food.updateMany({ _id: { $ne: id } }, { $set: { trending: false } });
    }

    const food = await Food.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      food
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  addFood,
  getFoods,
  deleteFood,
  updateFood
};