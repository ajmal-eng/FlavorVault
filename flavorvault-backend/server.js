const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const foodRoutes = require("./routes/foodRoutes");
const orderRoutes = require("./routes/orderRoutes");
const couponRoutes = require("./routes/couponRoutes");
const deliveryBoyRoutes = require("./routes/deliveryBoyRoutes");

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.set("io", io);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const frontendDir = path.resolve(__dirname, "..", "fronte -end");
app.use(express.static(frontendDir));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users", userRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/deliveryboys", deliveryBoyRoutes);

app.get("/health", (req, res) => {
  res.json({ success: true, message: "FlavorVault backend is running" });
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(frontendDir, "admin.html"));
});

app.get("/delivery-auth", (req, res) => {
  res.sendFile(path.join(frontendDir, "delivery-auth.html"));
});

app.get("/user", (req, res) => {
  res.sendFile(path.join(frontendDir, "indexuser.html"));
});

app.get("/", (req, res) => {
  res.json({ success: true, message: "FlavorVault Backend Running" });
});

const PORT = process.env.PORT || 5000;

const startServer = () => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Please stop the existing process or change PORT in the .env file.`);
    } else {
      console.error("Server error:", error);
    }
    process.exit(1);
  });
};

startServer();