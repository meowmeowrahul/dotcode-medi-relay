/**
 * Validation middleware for receiver-module routes.
 * Keeps route handlers clean by extracting validation logic.
 */

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate the POST /transfers request body.
 * Accepts both verbose frontend keys and compact backend keys.
 */
function validateCreateTransfer(req, res, next) {
  const { body } = req;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Request body is required',
    });
  }

  const doctorId = body.did || body.doctorId;
  const patientName = body.nam || body.patientName;

  if (!isNonEmptyString(patientName)) {
    return res.status(400).json({
      success: false,
      error: 'patientName (or nam) is required',
    });
  }

  if (!isNonEmptyString(doctorId)) {
    return res.status(400).json({
      success: false,
      error: 'doctorId (or did) is required',
    });
  }

  if (body.submissionTimestamp !== undefined && typeof body.submissionTimestamp !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'submissionTimestamp must be a number',
    });
  }

  if (body.timestamp !== undefined && typeof body.timestamp !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'timestamp must be a number',
    });
  }

  next();
}

/**
 * Validate the POST /transfers/:id/acknowledge request body.
 * Requires: timestamp (number).
 * Optional: arrivalNote (string), discrepancies (string).
 */
function validateAcknowledge(req, res, next) {
  const { timestamp, arrivalNote, discrepancies } = req.body;

  if (!timestamp || typeof timestamp !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'A valid numeric timestamp is required',
    });
  }

  // Sanitize optional string fields
  if (arrivalNote !== undefined && typeof arrivalNote !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'arrivalNote must be a string',
    });
  }

  if (discrepancies !== undefined && typeof discrepancies !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'discrepancies must be a string',
    });
  }

  next();
}

/**
 * Validate the PUT /transfers/:id request body.
 * At least one clinical field must be present.
 * Validates medication structure if provided.
 */
function validateUpdate(req, res, next) {
  const body = req.body;

  // Check that body is not empty
  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Request body cannot be empty',
    });
  }

  // Validate medications array structure if present
  if (body.med !== undefined) {
    if (!Array.isArray(body.med)) {
      return res.status(400).json({
        success: false,
        error: 'med must be an array of medication objects',
      });
    }

    for (let i = 0; i < body.med.length; i++) {
      const med = body.med[i];
      if (!med.n || !med.d || !med.r) {
        return res.status(400).json({
          success: false,
          error: `Medication at index ${i} must have n (name), d (dose), and r (route)`,
        });
      }
    }
  }

  // Validate allergies array if present
  if (body.alg !== undefined && !Array.isArray(body.alg)) {
    return res.status(400).json({
      success: false,
      error: 'alg must be an array of strings',
    });
  }

  // Validate pending investigations array if present
  if (body.pi !== undefined && !Array.isArray(body.pi)) {
    return res.status(400).json({
      success: false,
      error: 'pi must be an array of strings',
    });
  }

  // Validate vitals object structure if present
  if (body.vit !== undefined) {
    if (typeof body.vit !== 'object' || Array.isArray(body.vit)) {
      return res.status(400).json({
        success: false,
        error: 'vit must be an object with hr (number) and bp (string)',
      });
    }
  }

  // Validate age is a number if present
  if (body.age !== undefined && typeof body.age !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'age must be a number',
    });
  }

  if (body.did !== undefined && typeof body.did !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'did must be a string',
    });
  }

  if (body.fh !== undefined && typeof body.fh !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'fh must be a string',
    });
  }

  if (body.th !== undefined && typeof body.th !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'th must be a string',
    });
  }

  if (body.bg !== undefined && typeof body.bg !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'bg must be a string',
    });
  }

  next();
}

/**
 * Validate timestamp used to identify a unique update version.
 */
function validateUpdateTimestamp(req, res, next) {
  if (req.body.timestamp !== undefined && typeof req.body.timestamp !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'timestamp must be a number',
    });
  }

  next();
}

module.exports = { validateCreateTransfer, validateAcknowledge, validateUpdate, validateUpdateTimestamp };
