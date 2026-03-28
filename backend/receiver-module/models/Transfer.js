const mongoose = require('mongoose');
const { Schema } = mongoose;

// Sub-schemas for structured clinical data
const medicationSchema = new mongoose.Schema({
  n: { type: String, required: true },  // Drug name
  d: { type: String, required: true },  // Dose
  r: { type: String, required: true },  // Route
}, { _id: false });

const vitalsSchema = new mongoose.Schema({
  hr: { type: Number },   // Heart rate (bpm)
  bp: { type: String },   // Blood pressure (e.g. "120/80")
}, { _id: false });

const acknowledgementSchema = new mongoose.Schema({
  timestamp: { type: Number, required: true },
  arrivalNote: { type: String, default: '' },
  discrepancies: { type: String, default: '' },
  acknowledgedAt: { type: Date, default: Date.now },
}, { _id: false });

const historyEntrySchema = new mongoose.Schema({
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: String, default: '' },
}, { _id: false });

const transferSchema = new mongoose.Schema({
  // Core patient identifiers
  pid: { type: String, required: true },         // Patient ID
  nam: { type: String, required: true },         // Patient name
  age: { type: Number },                         // Age

  // Clinical data
  pd:  { type: String },                         // Primary diagnosis
  rt:  { type: String },                         // Reason for transfer
  alg: { type: [String], default: [] },          // Known allergies
  med: { type: [medicationSchema], default: [] },// Active medications
  vit: { type: vitalsSchema },                   // Vitals
  pi:  { type: [String], default: [] },          // Pending investigations
  sum: { type: String },                         // Clinical summary (max 200 words)

  // Transfer lifecycle
  status: {
    type: String,
    enum: ['IN_TRANSIT', 'RECEIVED', 'DISCREPANCY', 'UPDATED'],
    default: 'IN_TRANSIT',
  },

  // Receiver acknowledgement (populated on acknowledge)
  acknowledgement: { type: acknowledgementSchema, default: null },
  acknowledgementStatus: {
    type: String,
    enum: ['UNACKNOWLEDGED', 'ACKNOWLEDGED'],
    default: 'UNACKNOWLEDGED',
  },

  // Audit trail
  history: { type: [historyEntrySchema], default: [] },

  // Source submission timestamp (explicitly captured per form submit)
  submittedAt: { type: Date, default: Date.now },
  submissionTimestamp: { type: Number, default: () => Date.now() },

  // Version chain metadata for immutable update history
  previousVersionId: { type: Schema.Types.ObjectId, ref: 'Transfer', default: null },
  isCurrent: { type: Boolean, default: true },
}, {
  timestamps: true,  // createdAt, updatedAt
});

// Index for quick lookup by patient ID
transferSchema.index({ pid: 1 });
transferSchema.index({ status: 1 });
transferSchema.index({ pid: 1, submissionTimestamp: 1 }, { unique: true });
transferSchema.index({ pid: 1, isCurrent: 1 });

module.exports = mongoose.model('Transfer', transferSchema);
