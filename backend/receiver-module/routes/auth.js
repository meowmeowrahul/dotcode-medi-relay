const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function buildToken(user) {
  const normalizedRole = String(user.role || '').toLowerCase();
  const patientId = normalizedRole === 'patient'
    ? String(user.pid || user.patientId || user.username || '').trim()
    : '';

  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
      pid: patientId || undefined,
      patientId: patientId || undefined,
      hospitalName: user.hospitalName || '',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function toSafeUser(user) {
  const normalizedRole = String(user.role || '').toLowerCase();
  const patientId = normalizedRole === 'patient'
    ? String(user.pid || user.patientId || user.username || '').trim()
    : '';

  return {
    id: user._id,
    username: user.username,
    role: user.role,
    pid: patientId || undefined,
    patientId: patientId || undefined,
    hospitalName: user.hospitalName || '',
  };
}

router.post('/register', async (req, res) => {
  try {
    const { username, password, role, hospitalName } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ success: false, error: 'username, password, and role are required' });
    }

    if (!['doctor', 'patient'].includes(role)) {
      return res.status(400).json({ success: false, error: 'role must be either doctor or patient' });
    }

    if (role === 'doctor' && (!hospitalName || !hospitalName.trim())) {
      return res.status(400).json({ success: false, error: 'hospitalName is required for doctors' });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: username.toLowerCase(),
      password: hashed,
      role,
      hospitalName: role === 'doctor' ? hospitalName : '',
    });

    const token = buildToken(user);
    return res.status(201).json({ success: true, data: { token, user: toSafeUser(user) } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ success: false, error: 'username, password, and role are required' });
    }

    const user = await User.findOne({ username: username.toLowerCase(), role });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = buildToken(user);
    return res.json({ success: true, data: { token, user: toSafeUser(user) } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.json({ success: true, data: toSafeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
