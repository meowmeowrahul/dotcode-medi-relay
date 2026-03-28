const express = require('express');
const router = express.Router();
const Transfer = require('../models/Transfer');
const { normalizeTransferSubmission } = require('../utils/transferSubmission');
const { validateCreateTransfer, validateAcknowledge, validateUpdate, validateUpdateTimestamp } = require('../middleware/validation');

function collectAllowedUpdates(body) {
  const allowedFields = ['pid', 'nam', 'age', 'pd', 'rt', 'alg', 'med', 'vit', 'pi', 'sum'];
  const updates = {};
  const modifiedFields = [];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
      modifiedFields.push(field);
    }
  }

  return { updates, modifiedFields };
}

// ─────────────────────────────────────────────────────────────
// GET /api/transfers/pid/:pid/current — Fetch current version for PID
// ─────────────────────────────────────────────────────────────
router.get('/pid/:pid/current', async (req, res) => {
  try {
    const transfer = await Transfer.findOne({ pid: req.params.pid, isCurrent: true })
      .sort({ submissionTimestamp: -1 });

    if (!transfer) {
      return res.status(404).json({ success: false, error: 'No current transfer record found for this PID' });
    }

    res.json({ success: true, data: transfer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/transfers/pid/:pid/timeline — Fetch all versions for PID
// ─────────────────────────────────────────────────────────────
router.get('/pid/:pid/timeline', async (req, res) => {
  try {
    const versions = await Transfer.find({ pid: req.params.pid })
      .sort({ submissionTimestamp: -1 })
      .select('_id pid nam status acknowledgementStatus submissionTimestamp submittedAt isCurrent previousVersionId createdAt updatedAt');

    res.json({ success: true, data: versions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/transfers/pid/:pid/version/:timestamp — Fetch a specific snapshot
// ─────────────────────────────────────────────────────────────
router.get('/pid/:pid/version/:timestamp', async (req, res) => {
  try {
    const timestamp = Number.parseInt(req.params.timestamp, 10);
    if (Number.isNaN(timestamp)) {
      return res.status(400).json({ success: false, error: 'Invalid timestamp format' });
    }

    const transfer = await Transfer.findOne({ pid: req.params.pid, submissionTimestamp: timestamp });
    if (!transfer) {
      return res.status(404).json({ success: false, error: 'Transfer version not found' });
    }

    res.json({ success: true, data: transfer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/transfers/:id — Fetch a single transfer record
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, error: 'Transfer record not found' });
    }
    res.json({ success: true, data: transfer });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid transfer ID format' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/transfers — List all transfer records
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const transfers = await Transfer.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Transfer.countDocuments(filter);

    res.json({
      success: true,
      data: transfers,
      pagination: { total, limit: parseInt(limit), skip: parseInt(skip) },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/transfers — Create a new transfer record
// ─────────────────────────────────────────────────────────────
router.post('/', validateCreateTransfer, async (req, res) => {
  try {
    const normalizedPayload = normalizeTransferSubmission(req.body);

    // Keep only one editable current version per PID.
    await Transfer.updateMany({ pid: normalizedPayload.pid, isCurrent: true }, { $set: { isCurrent: false } });

    const transfer = new Transfer({
      ...normalizedPayload,
      status: 'IN_TRANSIT',
      acknowledgementStatus: 'UNACKNOWLEDGED',
      isCurrent: true,
      history: [{
        action: 'CREATED',
        timestamp: new Date(),
        details: `Transfer record created by sending facility at ${new Date(normalizedPayload.submissionTimestamp).toISOString()}`,
      }],
    });

    await transfer.save();
    res.status(201).json({ success: true, data: transfer });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/transfers/:id/updates — Create immutable updated version
// ─────────────────────────────────────────────────────────────
router.post('/:id/updates', validateUpdate, validateUpdateTimestamp, async (req, res) => {
  try {
    const currentTransfer = await Transfer.findById(req.params.id);
    if (!currentTransfer) {
      return res.status(404).json({ success: false, error: 'Transfer record not found' });
    }

    if (!currentTransfer.isCurrent) {
      return res.status(409).json({
        success: false,
        error: 'Only the current transfer version can be updated',
      });
    }

    const { updates, modifiedFields } = collectAllowedUpdates(req.body);
    if (modifiedFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided for update' });
    }

    const updateTimestamp = req.body.timestamp || Date.now();
    const nextVersion = new Transfer({
      pid: currentTransfer.pid,
      nam: currentTransfer.nam,
      age: currentTransfer.age,
      pd: currentTransfer.pd,
      rt: currentTransfer.rt,
      alg: currentTransfer.alg,
      med: currentTransfer.med,
      vit: currentTransfer.vit,
      pi: currentTransfer.pi,
      sum: currentTransfer.sum,
      acknowledgement: null,
      acknowledgementStatus: 'UNACKNOWLEDGED',
      status: 'UPDATED',
      previousVersionId: currentTransfer._id,
      isCurrent: true,
      submissionTimestamp: updateTimestamp,
      submittedAt: new Date(updateTimestamp),
      history: [
        ...(currentTransfer.history || []),
        {
          action: 'UPDATED',
          timestamp: new Date(updateTimestamp),
          details: `New version created. Fields modified: ${modifiedFields.join(', ')}`,
        },
      ],
    });

    Object.assign(nextVersion, updates);

    currentTransfer.isCurrent = false;
    await currentTransfer.save();
    await nextVersion.save();

    res.status(201).json({
      success: true,
      data: nextVersion,
      meta: {
        previousVersionId: currentTransfer._id,
        currentVersionId: nextVersion._id,
        timestamp: updateTimestamp,
      },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid transfer ID format' });
    }
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'A version for this patient with the same timestamp already exists',
      });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/transfers/:id/acknowledge — Receiving team acknowledges
// ─────────────────────────────────────────────────────────────
router.post('/:id/acknowledge', validateAcknowledge, async (req, res) => {
  try {
    const { timestamp, arrivalNote, discrepancies } = req.body;

    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, error: 'Transfer record not found' });
    }

    if (!transfer.isCurrent) {
      return res.status(409).json({
        success: false,
        error: 'Historical timeline versions are read-only and cannot be acknowledged',
      });
    }

    // Prevent duplicate acknowledgement
    if (transfer.acknowledgement && transfer.acknowledgement.timestamp) {
      return res.status(409).json({
        success: false,
        error: 'Transfer has already been acknowledged',
        acknowledgedAt: transfer.acknowledgement.acknowledgedAt,
      });
    }

    // Set acknowledgement data
    transfer.acknowledgement = {
      timestamp,
      arrivalNote: arrivalNote || '',
      discrepancies: discrepancies || '',
      acknowledgedAt: new Date(),
    };
    transfer.acknowledgementStatus = 'ACKNOWLEDGED';

    // Update status based on whether discrepancies were flagged
    transfer.status = discrepancies && discrepancies.trim().length > 0
      ? 'DISCREPANCY'
      : 'RECEIVED';

    // Append to audit trail
    transfer.history.push({
      action: 'ACKNOWLEDGED',
      timestamp: new Date(timestamp),
      details: discrepancies
        ? `Receipt acknowledged with discrepancies: ${discrepancies}`
        : `Receipt acknowledged. ${arrivalNote || ''}`.trim(),
    });

    await transfer.save();
    res.json({ success: true, data: transfer });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid transfer ID format' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/transfers/:id — Update/edit a transfer record
// ─────────────────────────────────────────────────────────────
router.put('/:id', validateUpdate, async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, error: 'Transfer record not found' });
    }

    if (!transfer.isCurrent) {
      return res.status(409).json({
        success: false,
        error: 'Historical versions are read-only. Update the current version instead.',
      });
    }

    const { updates, modifiedFields } = collectAllowedUpdates(req.body);

    if (modifiedFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided for update' });
    }

    // Apply updates
    Object.assign(transfer, updates);

    // Mark as updated
    transfer.status = 'UPDATED';

    // Append to audit trail
    transfer.history.push({
      action: 'UPDATED',
      timestamp: new Date(),
      details: `Record updated by receiving team. Fields modified: ${modifiedFields.join(', ')}`,
    });

    await transfer.save();
    res.json({ success: true, data: transfer });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid transfer ID format' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/transfers/:id — Remove a transfer record
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const transfer = await Transfer.findByIdAndDelete(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, error: 'Transfer record not found' });
    }
    res.json({ success: true, message: 'Transfer record deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid transfer ID format' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
