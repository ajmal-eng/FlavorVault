const express = require("express");
const router = express.Router();
const { loginChef } = require("../controllers/chefController");

router.post("/login", loginChef);

module.exports = router;
