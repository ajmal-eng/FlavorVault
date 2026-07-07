const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  updateOrderStatus,
  assignDeliveryBoy,
  downloadInvoice
} = require("../controllers/orderController");

router.post("/create", createOrder);

router.get("/", getOrders);

router.get("/:id/invoice", downloadInvoice);

router.put("/:id/status", updateOrderStatus);

router.put("/:id/assign", assignDeliveryBoy);

module.exports = router;
