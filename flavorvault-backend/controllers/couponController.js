const Coupon = require("../models/Coupon");

const addCoupon = async (req, res) => {
  try {
    const { code, type = 'percent', discount = 0, amount = 0, active = true } = req.body;

    if (type === 'percent') {
      if (discount <= 0 || discount > 100) {
        return res.status(400).json({ message: 'Discount must be between 1 and 100' });
      }
    } else if (type === 'fixed') {
      if (amount <= 0) return res.status(400).json({ message: 'Amount must be greater than 0 for fixed coupons' });
    }

    const coupon = await Coupon.create({ code, type, discount, amount, active });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ code: 1 });

    res.json({
      success: true,
      coupons
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getCouponByCode = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      code: String(req.params.code).toUpperCase(),
      active: true
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    res.json({
      success: true,
      coupon
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const updateCoupon = async (req, res) => {
  try {
    if (req.body.discount && (req.body.discount <= 0 || req.body.discount > 100)) {
      return res.status(400).json({
        message: "Discount must be between 1 and 100"
      });
    }

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    );

    if (!coupon) {
      return res.status(404).json({
        message: "Coupon not found"
      });
    }

    res.json({
      success: true,
      coupon
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        message: "Coupon not found"
      });
    }

    res.json({
      success: true,
      message: "Coupon deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = {
  addCoupon,
  getCoupons,
  getCouponByCode,
  updateCoupon,
  deleteCoupon
};
