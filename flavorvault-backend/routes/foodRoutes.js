const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  addFood,
  getFoods,
  deleteFood,
  updateFood
} = require("../controllers/foodController");

// Storage for food images uploaded from the admin panel (device upload).
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `food-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

// Upload a food image from the admin's device. Returns a URL (served via
// express.static on /uploads) that can be saved as the food's `image` field,
// same as a pasted image URL would be.
router.post("/upload-image", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file uploaded" });
    }
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
  });
});

router.post("/add", addFood);
router.get("/", getFoods);
router.delete("/:id", deleteFood);
router.put("/:id", updateFood);

module.exports = router;
