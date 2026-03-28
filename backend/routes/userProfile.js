const express = require('express');
const UserProfile = require('../models/UserProfile');

const router = express.Router();

const DEFAULT_PROFILE = {
  name: 'Dr. Aria Patel',
  role: 'doctor',
  hospitalName: 'City Care Medical Center',
  profileImage: '',
};

async function getOrCreateProfile() {
  let profile = await UserProfile.findOne();
  if (!profile) {
    profile = await UserProfile.create(DEFAULT_PROFILE);
  }
  return profile;
}

router.get('/profile', async (req, res) => {
  try {
    const profile = await getOrCreateProfile();
    return res.json({ success: true, data: profile });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { name, hospitalName, profileImage, role } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'name is required',
      });
    }

    const profile = await getOrCreateProfile();
    profile.name = name.trim();

    if (hospitalName !== undefined) {
      profile.hospitalName = typeof hospitalName === 'string' ? hospitalName.trim() : '';
    }

    if (profileImage !== undefined) {
      profile.profileImage = typeof profileImage === 'string' ? profileImage : '';
    }

    if (role && ['doctor', 'nurse', 'staff'].includes(role)) {
      profile.role = role;
    }

    await profile.save();
    return res.json({ success: true, data: profile });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/profile', async (req, res) => {
  try {
    await UserProfile.deleteMany({});
    return res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
