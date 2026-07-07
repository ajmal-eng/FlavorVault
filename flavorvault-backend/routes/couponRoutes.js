const express = require("express");
const router = express.Router();

const {
  addCoupon,
  getCoupons,
  getCouponByCode,
  updateCoupon,
  deleteCoupon
} = require("../controllers/couponController");

router.post("/add", addCoupon);
router.get("/", getCoupons);
router.get("/:code", getCouponByCode);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

module.exports = router;
