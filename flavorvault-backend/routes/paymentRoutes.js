const express = require("express");
const router = express.Router();
const { getRestaurantUpiId } = require("../controllers/paymentController");

router.get("/upi-id", getRestaurantUpiId);

module.exports = router;
