const DeliveryBoy = require("../models/DeliveryBoy");
const bcrypt = require("bcryptjs");

const addDeliveryBoy = async (req, res) => {
  try {
    const { name, email, phone, vehicle, password } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and phone are required"
      });
    }

    const emailExists = await DeliveryBoy.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Delivery boy with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password || "deliver123", 10);

    const deliveryBoy = await DeliveryBoy.create({
      name,
      email,
      phone,
      vehicle,
      password: hashedPassword
    });

    const { password: _, ...responseBoy } = deliveryBoy.toObject();

    res.status(201).json({
      success: true,
      deliveryBoy: responseBoy
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getDeliveryBoys = async (req, res) => {
  try {
    const deliveryBoys = await DeliveryBoy.find().select('-password');

    res.json({
      success: true,
      deliveryBoys
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const updateDeliveryBoy = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      deliveryBoy
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const deleteDeliveryBoy = async (req, res) => {
  try {

    await DeliveryBoy.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: "Delivery Boy Deleted"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({
        success: false,
        message: "lat and lng must be numbers"
      });
    }

    const deliveryBoy =
      await DeliveryBoy.findByIdAndUpdate(
        req.params.id,
        {
          location: { lat, lng }
        },
        { new: true }
      );

    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: "Delivery Boy not found"
      });
    }

    res.json({
      success: true,
      location: deliveryBoy.location
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const getLocation = async (req, res) => {
  try {

    const deliveryBoy =
      await DeliveryBoy.findById(req.params.id);

    if (!deliveryBoy) {
      return res.status(404).json({
        success: false,
        message: "Delivery Boy not found"
      });
    }

    res.json({
      success: true,
      location: deliveryBoy.location || { lat: 0, lng: 0 }
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};

const loginDeliveryBoy = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const deliveryBoy = await DeliveryBoy.findOne({ email });
    if (!deliveryBoy) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, deliveryBoy.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const { password: _, ...responseBoy } = deliveryBoy.toObject();
    res.json({ success: true, deliveryBoy: responseBoy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addDeliveryBoy,
  getDeliveryBoys,
  updateDeliveryBoy,
  deleteDeliveryBoy,
  updateLocation,
  getLocation,
  loginDeliveryBoy
};
