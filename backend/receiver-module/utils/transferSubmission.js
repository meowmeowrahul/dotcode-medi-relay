function parseList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAge(age) {
  if (age === undefined || age === null || age === '') {
    return undefined;
  }

  const parsed = Number.parseInt(age, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseMedications(value) {
  if (Array.isArray(value)) {
    return value
      .map((med) => {
        if (!med || typeof med !== 'object') {
          return null;
        }

        if (!med.n || !med.d || !med.r) {
          return null;
        }

        return {
          n: String(med.n).trim(),
          d: String(med.d).trim(),
          r: String(med.r).trim(),
        };
      })
      .filter(Boolean);
  }

  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  const segments = value
    .split(/[;\n]/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.map((segment) => ({
    n: segment,
    d: 'Unspecified',
    r: 'Unspecified',
  }));
}

function parseVitals(value) {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const hrRaw = value.hr;
    const parsedHr = typeof hrRaw === 'number'
      ? hrRaw
      : (typeof hrRaw === 'string' && hrRaw.trim() ? Number.parseInt(hrRaw, 10) : undefined);

    return {
      hr: Number.isNaN(parsedHr) ? undefined : parsedHr,
      bp: value.bp !== undefined && value.bp !== null ? String(value.bp).trim() : undefined,
    };
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const hrMatch = value.match(/(?:^|\b)(?:hr|heart\s*rate)\s*[:=-]?\s*(\d{2,3})\b/i);
  const bpMatch = value.match(/\b(\d{2,3}\/\d{2,3})\b/);

  return {
    hr: hrMatch ? Number.parseInt(hrMatch[1], 10) : undefined,
    bp: bpMatch ? bpMatch[1] : undefined,
  };
}

function getSubmissionTimestamp(value) {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return Date.now();
  }
  return value;
}

function normalizeTransferSubmission(body) {
  const submissionTimestamp = getSubmissionTimestamp(body.submissionTimestamp || body.timestamp);

  const normalized = {
    did: body.did || body.doctorId,
    fh: body.fh || body.fromHospital,
    th: body.th || body.toHospital,
    bg: body.bg || body.bloodGroup,
    nam: body.nam || body.patientName,
    age: body.age !== undefined ? parseAge(body.age) : undefined,
    pd: body.pd || body.primaryDiagnosis,
    rt: body.rt || body.transferReason,
    alg: body.alg !== undefined ? parseList(body.alg) : parseList(body.allergies),
    med: body.med !== undefined ? parseMedications(body.med) : parseMedications(body.activeMedications),
    vit: body.vit !== undefined ? parseVitals(body.vit) : parseVitals(body.lastVitals),
    pi: body.pi !== undefined ? parseList(body.pi) : parseList(body.pendingInvestigations),
    sum: body.sum || body.clinicalSummary,
    submittedAt: new Date(submissionTimestamp),
    submissionTimestamp,
  };

  Object.keys(normalized).forEach((key) => {
    if (normalized[key] === undefined) {
      delete normalized[key];
    }
  });

  return normalized;
}

module.exports = { normalizeTransferSubmission };
