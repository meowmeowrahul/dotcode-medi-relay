const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['doctor', 'nurse', 'staff'],
      default: 'doctor',
    },
    hospitalName: { type: String, default: '', trim: true },
    profileImage: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);
