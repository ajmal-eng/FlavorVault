const PDFDocument = require("pdfkit");
const Order = require("../models/Order");
const User = require("../models/User");

const createOrder = async (req, res) => {
  try {

    const {
      customerName,
      userId = null,
      phone,
      address,
      items,
      totalAmount,
      paymentMethod = "COD",
      paymentStatus,
      deliveryBoyId = null,
      deliveryBoyName = "",
      couponCode = "",
      discount = 0,
      discountType = 'percent',
      subtotal = 0
    } = req.body;

    const normalizedPaymentMethod = paymentMethod === "Online" ? "Online" : "COD";

    const order = await Order.create({
      customerName,
      userId: userId || null,
      phone,
      address,
      items,
      totalAmount,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: paymentStatus || (normalizedPaymentMethod === "Online" ? "Paid" : "Pending"),
      deliveryBoyId,
      deliveryBoyName,
      couponCode,
      discount,
      discountType,
      subtotal
    });

    req.app.get("io").emit("new-order", order);

    res.status(201).json({
      success: true,
      order
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const getOrders = async (req, res) => {
  try {

    const orders = await Order.find().sort({
      createdAt: -1
    });

    res.json({
      success: true,
      orders
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const updateOrderStatus = async (req, res) => {
  try {

    const { status } = req.body;
    const update = { status };

    if (String(status).toLowerCase() === "delivered") {
      update.paymentStatus = "Paid";
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (String(status).toLowerCase() === "delivered") {
      try {
        let user = null;
        if (order.userId) {
          user = await User.findById(order.userId);
        }
        if (!user && order.phone) {
          // Fallback for older orders placed before userId was tracked.
          user = await User.findOne({ phone: order.phone });
        }
        if (user) {
          // 1 point for every ₹1000 spent (rounded down).
          const pointsEarned = Math.floor((order.totalAmount || 0) / 1000);
          user.points = (user.points || 0) + pointsEarned;
          await user.save();
        }
      } catch (e) { console.error("Points award error:", e); }
    }

    req.app.get("io").emit("order-status-updated", {
      orderId: order._id,
      status: order.status
    });

    res.json({
      success: true,
      order
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const assignDeliveryBoy = async (req, res) => {
  try {

    const { deliveryBoyId, deliveryBoyName } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        deliveryBoyId,
        deliveryBoyName
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    req.app.get("io").emit("delivery-assigned", {
      deliveryBoyId,
      orderId: order._id
    });

    res.json({
      success: true,
      order
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    const doc = new PDFDocument({ margin: 36 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );

    doc.pipe(res);

    const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
    const items = Array.isArray(order.items) ? order.items : [];

    doc.fontSize(22).font("Helvetica-Bold").text("FlavorVault", { align: "left" });
    doc.fontSize(10).font("Helvetica").text("Food delivery • Premium service", { align: "left" });
    doc.moveDown(0.5);

    doc.fontSize(16).font("Helvetica-Bold").text("Invoice", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(11).font("Helvetica").text(`Invoice #: ${order._id}`);
    doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleString()}`);
    doc.text(`Status: ${order.status || "Pending"}`);
    doc.moveDown();

    doc.fontSize(12).font("Helvetica-Bold").text("Customer Details");
    doc.fontSize(11).font("Helvetica").text(`Name: ${order.customerName || "N/A"}`);
    doc.text(`Phone: ${order.phone || "N/A"}`);
    doc.text(`Address: ${order.address || "N/A"}`);
    doc.moveDown();

    doc.fontSize(12).font("Helvetica-Bold").text("Order Summary");
    doc.moveDown(0.3);

    const startX = doc.x;
    const startY = doc.y;
    doc.rect(startX, startY, 520, 18).stroke();
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Item", startX + 8, startY + 4);
    doc.text("Qty", startX + 320, startY + 4);
    doc.text("Price", startX + 380, startY + 4);
    doc.text("Amount", startX + 450, startY + 4);

    let currentY = startY + 18;
    items.forEach((item) => {
      doc.rect(startX, currentY, 520, 18).stroke();
      doc.fontSize(10).font("Helvetica");
      doc.text(item.name || "Item", startX + 8, currentY + 4, { width: 300 });
      doc.text(String(item.quantity || 1), startX + 320, currentY + 4);
      doc.text(formatCurrency(item.price || 0), startX + 380, currentY + 4);
      doc.text(formatCurrency((item.price || 0) * (item.quantity || 1)), startX + 450, currentY + 4);
      currentY += 18;
    });

    doc.moveDown(2.2);
    doc.fontSize(11).font("Helvetica");
    if (order.subtotal && order.subtotal > 0) {
      doc.text(`Subtotal: ${formatCurrency(order.subtotal)}`, { align: "right" });
    }
    if (order.couponCode) {
      if (order.discountType === 'fixed') {
        doc.text(`Coupon Applied: ${order.couponCode} ($${Number(order.discount).toFixed(2)} off)`, { align: "right" });
      } else {
        doc.text(`Coupon Applied: ${order.couponCode} (${order.discount}% off)`, { align: "right" });
      }
    }
    doc.fontSize(12).font("Helvetica-Bold").text(`Total: ${formatCurrency(order.totalAmount)}`, { align: "right" });
    doc.moveDown(1);
    doc.fontSize(10).font("Helvetica").text("Payment Method: " + (order.paymentMethod || "COD"), { align: "left" });
    doc.text("Payment Status: " + (order.paymentStatus || "Pending"), { align: "left" });
    doc.moveDown(1.2);
    doc.fontSize(9).font("Helvetica-Oblique").text("Thank you for ordering with FlavorVault.", { align: "center" });

    doc.end();
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Returns the single oldest order still needing preparation - the chef
// only ever sees one order at a time, never a full list.
const getChefQueue = async (req, res) => {
  try {
    const order = await Order.findOne({ prepared: false }).sort({ createdAt: 1 });
    const queueLength = await Order.countDocuments({ prepared: false });
    res.json({ success: true, order: order || null, queueLength });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markOrderPrepared = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { prepared: true },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    req.app.get("io").emit("order-prepared", { orderId: order._id });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markPaymentReceived = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "Paid" },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    req.app.get("io").emit("payment-received", { orderId: order._id });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  assignDeliveryBoy,
  downloadInvoice,
  getChefQueue,
  markOrderPrepared,
  markPaymentReceived
};
