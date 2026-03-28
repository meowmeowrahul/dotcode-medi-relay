require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { verifyToken } = require('./receiver-module/middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
const authRoutes = require('./receiver-module/routes/auth');
const transferRoutes = require('./receiver-module/routes/transfers');
app.use('/api/auth', authRoutes);
app.use('/api/transfers', verifyToken, transferRoutes);

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
