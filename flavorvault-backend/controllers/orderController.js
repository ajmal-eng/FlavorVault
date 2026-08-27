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
      { returnDocument: 'after' }
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
      { returnDocument: 'after' }
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

// FlavorVault brand palette - kept in sync with the CSS variables used
// across the frontend (indexuser.html) so the PDF actually looks like it
// belongs to the same product.
const BRAND = {
  accent: "#e8572a",
  accentHover: "#d04420",
  green: "#2d8a4e",
  greenLight: "#eaf6ee",
  fg: "#1a1209",
  fgMuted: "#7a6e5d",
  bg: "#faf6f1",
  card: "#ffffff",
  border: "#e8dfd3"
};

// Same status colors as the .status-* badges on the user's "My Orders" page.
const STATUS_STYLES = {
  pending: { bg: "#fef3c7", fg: "#92400e" },
  preparing: { bg: "#dbeafe", fg: "#1e40af" },
  "out for delivery": { bg: "#ede9fe", fg: "#6d28d9" },
  delivered: { bg: BRAND.greenLight, fg: BRAND.green },
  cancelled: { bg: "#fee2e2", fg: "#991b1b" }
};

const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    const doc = new PDFDocument({ size: "A4", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );

    doc.pipe(res);

    const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
    const items = Array.isArray(order.items) ? order.items : [];
    const pageWidth = doc.page.width;
    const margin = 44;
    const contentWidth = pageWidth - margin * 2;
    const status = String(order.status || "pending").toLowerCase();
    const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.pending;
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

    // ---------- Header band ----------
    const headerHeight = 138;
    doc.rect(0, 0, pageWidth, headerHeight).fill(BRAND.accent);
    // subtle darker strip along the bottom edge of the header for depth
    doc.rect(0, headerHeight - 6, pageWidth, 6).fill(BRAND.accentHover);

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(26)
      .text("FlavorVault", margin, 40);
    doc.font("Helvetica").fontSize(10).fillColor("#fde9e0")
      .text("Food delivery  •  Premium service", margin, 72);

    doc.font("Helvetica-Bold").fontSize(22).fillColor("#ffffff")
      .text("INVOICE", margin, 40, { width: contentWidth, align: "right" });
    doc.font("Helvetica").fontSize(10).fillColor("#fde9e0")
      .text(`#${String(order._id).slice(-8).toUpperCase()}`, margin, 70, { width: contentWidth, align: "right" })
      .text(new Date(order.createdAt || Date.now()).toLocaleString(), margin, 84, { width: contentWidth, align: "right" });

    let y = headerHeight + 26;

    // ---------- Bill To / Order Info cards ----------
    const cardGap = 16;
    const cardWidth = (contentWidth - cardGap) / 2;
    const cardHeight = 96;

    const drawCard = (x, title) => {
      doc.roundedRect(x, y, cardWidth, cardHeight, 10).fillAndStroke(BRAND.bg, BRAND.border);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND.fgMuted)
        .text(title.toUpperCase(), x + 16, y + 14, { characterSpacing: 0.6 });
    };

    drawCard(margin, "Bill To");
    doc.font("Helvetica-Bold").fontSize(12).fillColor(BRAND.fg)
      .text(order.customerName || "Guest Customer", margin + 16, y + 32, { width: cardWidth - 32 });
    doc.font("Helvetica").fontSize(10).fillColor(BRAND.fgMuted)
      .text(order.phone || "N/A", margin + 16, y + 51, { width: cardWidth - 32 })
      .text(order.address || "N/A", margin + 16, y + 65, { width: cardWidth - 32 });

    const rightCardX = margin + cardWidth + cardGap;
    drawCard(rightCardX, "Order Info");
    // status pill
    const pillLabel = statusLabel;
    doc.font("Helvetica-Bold").fontSize(9);
    const pillTextWidth = doc.widthOfString(pillLabel);
    const pillWidth = pillTextWidth + 20;
    doc.roundedRect(rightCardX + 16, y + 30, pillWidth, 18, 9).fill(statusStyle.bg);
    doc.fillColor(statusStyle.fg).text(pillLabel, rightCardX + 16, y + 35, { width: pillWidth, align: "center" });
    doc.font("Helvetica").fontSize(10).fillColor(BRAND.fgMuted)
      .text(`Payment: ${order.paymentMethod || "COD"}`, rightCardX + 16, y + 56, { width: cardWidth - 32 })
      .text(`Payment status: ${order.paymentStatus || "Pending"}`, rightCardX + 16, y + 70, { width: cardWidth - 32 });

    y += cardHeight + 30;

    // ---------- Items table ----------
    doc.font("Helvetica-Bold").fontSize(12).fillColor(BRAND.fg)
      .text("Order Summary", margin, y);
    y += 22;

    const colItem = margin + 14;
    const colQty = margin + contentWidth - 190;
    const colPrice = margin + contentWidth - 130;
    const colAmount = margin + contentWidth - 60;
    const rowHeight = 26;
    const headerRowHeight = 28;

    doc.roundedRect(margin, y, contentWidth, headerRowHeight, 8).fill(BRAND.accent);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#ffffff");
    doc.text("ITEM", colItem, y + 10);
    doc.text("QTY", colQty, y + 10, { width: 40, align: "center" });
    doc.text("PRICE", colPrice, y + 10, { width: 60, align: "right" });
    doc.text("AMOUNT", colAmount, y + 10, { width: 60, align: "right" });
    y += headerRowHeight;

    items.forEach((item, i) => {
      const rowY = y + i * rowHeight;
      if (i % 2 === 1) {
        doc.rect(margin, rowY, contentWidth, rowHeight).fill(BRAND.bg);
      }
      doc.font("Helvetica").fontSize(10).fillColor(BRAND.fg);
      doc.text(item.name || "Item", colItem, rowY + 8, { width: colQty - colItem - 10 });
      doc.text(String(item.quantity || 1), colQty, rowY + 8, { width: 40, align: "center" });
      doc.text(formatCurrency(item.price || 0), colPrice, rowY + 8, { width: 60, align: "right" });
      doc.font("Helvetica-Bold").text(formatCurrency((item.price || 0) * (item.quantity || 1)), colAmount, rowY + 8, { width: 60, align: "right" });
    });

    const tableTop = y - headerRowHeight;
    const tableBottom = y + items.length * rowHeight;
    doc.roundedRect(margin, tableTop, contentWidth, tableBottom - tableTop, 8).stroke(BRAND.border);

    y = tableBottom + 22;

    // ---------- Totals ----------
    const totalsWidth = 230;
    const totalsX = margin + contentWidth - totalsWidth;
    doc.font("Helvetica").fontSize(10).fillColor(BRAND.fgMuted);

    if (order.subtotal && order.subtotal > 0) {
      doc.text("Subtotal", totalsX, y, { width: totalsWidth - 90 });
      doc.fillColor(BRAND.fg).text(formatCurrency(order.subtotal), totalsX + totalsWidth - 90, y, { width: 90, align: "right" });
      y += 18;
      doc.fillColor(BRAND.fgMuted);
    }

    if (order.couponCode) {
      const discountText = order.discountType === "fixed"
        ? `-$${Number(order.discount).toFixed(2)}`
        : `-${order.discount}%`;
      doc.text(`Coupon (${order.couponCode})`, totalsX, y, { width: totalsWidth - 90 });
      doc.fillColor(BRAND.green).text(discountText, totalsX + totalsWidth - 90, y, { width: 90, align: "right" });
      y += 18;
      doc.fillColor(BRAND.fgMuted);
    }

    y += 6;
    const totalBoxHeight = 38;
    doc.roundedRect(totalsX, y, totalsWidth, totalBoxHeight, 8).fill(BRAND.accent);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#fde9e0")
      .text("TOTAL", totalsX + 16, y + 12);
    doc.font("Helvetica-Bold").fontSize(15).fillColor("#ffffff")
      .text(formatCurrency(order.totalAmount), totalsX, y + 9, { width: totalsWidth - 16, align: "right" });

    y += totalBoxHeight + 40;

    // ---------- Footer ----------
    doc.moveTo(margin, y).lineTo(margin + contentWidth, y).lineWidth(1).strokeColor(BRAND.border).stroke();
    y += 16;
    doc.font("Helvetica-Oblique").fontSize(10).fillColor(BRAND.fgMuted)
      .text("Thank you for ordering with FlavorVault \u2014 we hope you enjoyed your meal!", margin, y, { width: contentWidth, align: "center" });
    y += 18;
    doc.font("Helvetica").fontSize(8).fillColor(BRAND.fgMuted)
      .text("This is a system-generated invoice and does not require a signature.", margin, y, { width: contentWidth, align: "center" });

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
      { returnDocument: 'after' }
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
      { returnDocument: 'after' }
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
