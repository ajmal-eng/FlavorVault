// Exposes the restaurant's own UPI ID so the customer-facing site can
// generate a "scan to pay" QR code, the same way the delivery site
// already does for delivery boys' own UPI IDs. This is meant to be public
// info (a UPI handle is what you'd hand out to anyone paying you), so no
// auth is needed to read it.
const getRestaurantUpiId = async (req, res) => {
  const upiId = process.env.RESTAURANT_UPI_ID;
  if (!upiId) {
    return res.status(400).json({
      success: false,
      message: "Restaurant UPI ID is not configured on the server yet"
    });
  }
  res.json({ success: true, upiId });
};

module.exports = { getRestaurantUpiId };
