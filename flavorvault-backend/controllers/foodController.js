const Food = require("../models/Food");
const Order = require("../models/Order");

// Foods that haven't received any real user ratings yet show this friendly
// default (matches what the site always showed before real ratings existed).
const DEFAULT_RATING = 4.5;

function withComputedRating(foodDoc) {
  const food = foodDoc.toObject ? foodDoc.toObject() : foodDoc;
  const hasRatings = food.ratingCount > 0;
  return {
    ...food,
    avgRating: hasRatings ? Math.round((food.ratingSum / food.ratingCount) * 10) / 10 : DEFAULT_RATING,
    reviewCount: food.ratingCount || 0
  };
}

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
      foods: foods.map(withComputedRating)
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Submit a 1-5 star rating for a food item after ordering it. Requires the
// orderId so we can confirm this food was actually part of that order (and
// so we can prevent rating the same order's item more than once), but does
// not require the user to be logged in as an extra check beyond that -
// consistent with how the rest of the ordering flow already works here.
const rateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, orderId } = req.body;

    const ratingValue = Number(rating);
    if (!ratingValue || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({ success: false, message: "Rating must be a number between 1 and 5" });
    }
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const orderedThisFood = order.items.some(item => String(item.foodId) === String(id));
    if (!orderedThisFood) {
      return res.status(400).json({ success: false, message: "This food was not part of that order" });
    }
    if (order.ratedFoodIds.includes(String(id))) {
      return res.status(400).json({ success: false, message: "You already rated this item for this order" });
    }

    const food = await Food.findById(id);
    if (!food) {
      return res.status(404).json({ success: false, message: "Food not found" });
    }

    food.ratingSum = (food.ratingSum || 0) + ratingValue;
    food.ratingCount = (food.ratingCount || 0) + 1;
    await food.save();

    order.ratedFoodIds.push(String(id));
    await order.save();

    res.json({ success: true, food: withComputedRating(food) });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      { returnDocument: 'after' }
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
  updateFood,
  rateFood
};