const express = require("express");
const router = express.Router();

const { registerUser, loginUser, getUserPoints, redeemReward, getRewardCatalog, getRecommendations, forgotPassword, verifyResetCode, resetPassword } = require("../controllers/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id/points", getUserPoints);
router.post("/redeem", redeemReward);
router.get("/rewards/catalog", getRewardCatalog);
router.get("/recommendations", getRecommendations);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

module.exports = router;
