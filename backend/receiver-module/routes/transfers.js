const express = require('express');
const router = express.Router();
const Transfer = require('../models/Transfer');
const { validateAcknowledge, validateUpdate } = require('../middleware/validation');

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
router.post('/', async (req, res) => {
  try {
    const transfer = new Transfer({
      ...req.body,
      status: 'IN_TRANSIT',
      history: [{
        action: 'CREATED',
        timestamp: new Date(),
        details: 'Transfer record created by sending facility',
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
// POST /api/transfers/:id/acknowledge — Receiving team acknowledges
// ─────────────────────────────────────────────────────────────
router.post('/:id/acknowledge', validateAcknowledge, async (req, res) => {
  try {
    const { timestamp, arrivalNote, discrepancies } = req.body;

    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) {
      return res.status(404).json({ success: false, error: 'Transfer record not found' });
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

    // Only allow clinical field updates (not lifecycle fields)
    const allowedFields = ['pid', 'nam', 'age', 'pd', 'rt', 'alg', 'med', 'vit', 'pi', 'sum'];
    const updates = {};
    const modifiedFields = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
        modifiedFields.push(field);
      }
    }

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
