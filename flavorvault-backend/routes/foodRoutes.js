const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const {
  addFood,
  getFoods,
  deleteFood,
  updateFood
} = require("../controllers/foodController");

// Cloudinary config (reads credentials from environment variables — never
// hardcode these). Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and
// CLOUDINARY_API_SECRET locally in .env and in Render's Environment tab.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for food images uploaded from the admin panel (device upload).
// Files now go straight to Cloudinary instead of Render's local disk, so
// they survive restarts/redeploys.
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "flavorvault-uploads",
    allowed_formats: ["jpg", "jpeg", "png", "jfif", "webp"],
  },
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

// Upload a food image from the admin's device. Returns the permanent
// Cloudinary URL that can be saved as the food's `image` field, same as a
// pasted image URL would be.
router.post("/upload-image", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file uploaded" });
    }
    res.json({ success: true, url: req.file.path });
  });
});

router.post("/add", addFood);
router.get("/", getFoods);
router.delete("/:id", deleteFood);
router.put("/:id", updateFood);

module.exports = router;
