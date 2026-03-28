const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const TransferToken = require('./qrModelExtension');
const { JWT_SECRET } = require('../../../receiver-module/middleware/auth');

let TransferModel;
try {
  // Optional read-through to real transfer model when available.
  // The feature still works in isolation even if this import changes later.
  // eslint-disable-next-line global-require
  TransferModel = require('../../../receiver-module/models/Transfer');
} catch (_error) {
  TransferModel = null;
}

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

async function generateToken(req, res) {
  try {
    const bearer = extractBearerToken(req);
    if (!bearer) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token missing',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(bearer, JWT_SECRET);
    } catch (_err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    const role = String(decoded?.role || '').toLowerCase();
    if (role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only doctors can generate secure transfer tokens.',
      });
    }

    const { recordId } = req.body || {};

    if (!recordId || !mongoose.isValidObjectId(recordId)) {
      return res.status(400).json({
        success: false,
        error: 'Valid recordId is required',
      });
    }

    const uuid = randomUUID();

    const tokenDoc = await TransferToken.create({
      uuid,
      recordId,
    });

    return res.status(201).json({
      success: true,
      data: {
        uuid: tokenDoc.uuid,
        recordId: tokenDoc.recordId,
        expiresInSeconds: 60 * 60 * 24,
        deepLink: `https://medirelay.app/transfer/${tokenDoc.uuid}`,
      },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Token collision detected. Please retry.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to generate secure transfer token',
    });
  }
}

async function validateScan(req, res) {
  try {
    const { uuid } = req.params || {};

    if (!uuid || typeof uuid !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'UUID is required',
      });
    }

    const bearer = extractBearerToken(req);
    if (!bearer) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token missing',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(bearer, JWT_SECRET);
    } catch (_err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    const role = String(decoded?.role || '').toLowerCase();
    if (role !== 'doctor' && role !== 'patient') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Unsupported role.',
      });
    }

    const tokenDoc = await TransferToken.findOne({ uuid }).lean();
    if (!tokenDoc) {
      return res.status(404).json({
        success: false,
        error: 'Token not found or expired',
      });
    }

    let record = null;
    if (TransferModel) {
      record = await TransferModel.findById(tokenDoc.recordId).lean();
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Transfer record not found',
      });
    }

    if (role === 'patient') {
      const patientCandidates = [decoded?.pid, decoded?.patientId, decoded?.username, decoded?.id]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const recordPid = String(record?.pid || '').toLowerCase();
      const ownsRecord = recordPid && patientCandidates.includes(recordPid);

      if (!ownsRecord) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Patients can only access their own transfer records.',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        uuid,
        record,
      },
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to validate secure QR token',
    });
  }
}

module.exports = {
  generateToken,
  validateScan,
};
