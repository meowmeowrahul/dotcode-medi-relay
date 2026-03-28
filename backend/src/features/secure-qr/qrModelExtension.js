const mongoose = require('mongoose');

const { Schema } = mongoose;

const transferTokenSchema = new Schema(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    recordId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Transfer',
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.models.TransferToken || mongoose.model('TransferToken', transferTokenSchema);
