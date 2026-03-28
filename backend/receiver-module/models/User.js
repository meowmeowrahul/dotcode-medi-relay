const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['doctor', 'patient'],
      required: true,
    },
    hospitalName: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

userSchema.path('hospitalName').validate(function (value) {
  if (this.role === 'doctor' && (!value || value.trim().length === 0)) {
    return false;
  }
  return true;
}, 'Hospital name is required for doctors');

module.exports = mongoose.model('User', userSchema);
