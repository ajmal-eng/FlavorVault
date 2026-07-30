const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  updateOrderStatus,
  assignDeliveryBoy,
  downloadInvoice,
  getChefQueue,
  markOrderPrepared,
  markPaymentReceived
} = require("../controllers/orderController");

router.post("/create", createOrder);

router.get("/", getOrders);

router.get("/chef-queue", getChefQueue);

router.get("/:id/invoice", downloadInvoice);

router.put("/:id/status", updateOrderStatus);

router.put("/:id/assign", assignDeliveryBoy);

router.put("/:id/mark-prepared", markOrderPrepared);

router.put("/:id/mark-paid", markPaymentReceived);

module.exports = router;
