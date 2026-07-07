const express = require("express");

const router = express.Router();

const {
  addDeliveryBoy,
  getDeliveryBoys,
  updateDeliveryBoy,
  deleteDeliveryBoy,
  updateLocation,
  getLocation,
  loginDeliveryBoy
} = require(
  "../controllers/deliveryBoyController"
);

router.post("/add", addDeliveryBoy);
router.post("/login", loginDeliveryBoy);

router.get("/", getDeliveryBoys);

router.put("/:id", updateDeliveryBoy);

router.put("/:id/location", updateLocation);

router.get("/:id/location", getLocation);

router.delete("/:id", deleteDeliveryBoy);

module.exports = router;
