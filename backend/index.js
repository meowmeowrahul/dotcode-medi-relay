require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { verifyToken } = require('./receiver-module/middleware/auth');

const app = express();
<<<<<<< HEAD
const PORT = process.env.PORT || 3001;
=======
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/medirelay";
>>>>>>> 4c1612deaf4d47488e4b360322e26ee92b497901

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
const authRoutes = require('./receiver-module/routes/auth');
const transferRoutes = require('./receiver-module/routes/transfers');
<<<<<<< HEAD
app.use('/api/auth', authRoutes);
app.use('/api/transfers', verifyToken, transferRoutes);
=======
const userProfileRoutes = require('./routes/userProfile');
app.use('/api/transfers', transferRoutes);
app.use('/api/user', userProfileRoutes);
>>>>>>> 4c1612deaf4d47488e4b360322e26ee92b497901

app.get("/", (req, res) => {
  res.json({ message: "MediRelay API is running" });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 LAN-accessible on http://<your-machine-ip>:${PORT}`);
});
