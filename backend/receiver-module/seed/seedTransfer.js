/**
 * Seed script: creates a sample transfer record in MongoDB
 * and prints the lz-string compressed payload for QR code testing.
 *
 * Usage:
 *   1. Make sure MongoDB is running and MONGODB_URI is set in backend/.env
 *   2. Run: node receiver-module/seed/seedTransfer.js
 *   3. Copy the compressed string output to generate a test QR code
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Transfer = require('../models/Transfer');

// lz-string is optional here — only needed if you want to generate the compressed payload
let LZString;
try {
  LZString = require('lz-string');
} catch {
  console.log('⚠️  lz-string not installed in backend. Install it to generate compressed QR payloads:');
  console.log('   npm install lz-string');
  LZString = null;
}

const sampleTransfer = {
  pid: 'P-2024-0847',
  nam: 'Rajesh Kumar',
  age: 68,
  pd: 'Acute COPD Exacerbation with Type 2 Respiratory Failure',
  rt: 'Requires ICU admission and non-invasive ventilation not available at referring facility',
  alg: ['Penicillin', 'Sulfonamides'],
  med: [
    { n: 'Salbutamol Nebulisation', d: '5mg', r: 'Inhaled' },
    { n: 'Ipratropium Bromide', d: '500mcg', r: 'Inhaled' },
    { n: 'Methylprednisolone', d: '125mg IV', r: 'Intravenous' },
    { n: 'Enoxaparin', d: '40mg', r: 'Subcutaneous' },
  ],
  vit: { hr: 112, bp: '148/92' },
  pi: ['ABG (Arterial Blood Gas)', 'CT Chest with Contrast', 'Sputum Culture'],
  sum: 'Known case of COPD Gold Stage III, current smoker. Presented with acute exacerbation with increasing dyspnoea over 3 days. SpO2 82% on room air, improved to 91% on 6L O2 via face mask. Chest X-ray shows hyperinflation with no consolidation. Started on nebulised bronchodilators and IV steroids. Requires step-up to NIV which is not available at this facility. Hemodynamically stable. No prior intubation history.',
};

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI not set. Create backend/.env with MONGO_URI=mongodb://...');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Create the transfer record
    const transfer = new Transfer({
      ...sampleTransfer,
      status: 'IN_TRANSIT',
      history: [{
        action: 'CREATED',
        timestamp: new Date(),
        details: 'Transfer record created by sending facility (seed script)',
      }],
    });

    await transfer.save();
    console.log('\n✅ Sample transfer record created');
    console.log(`   _id: ${transfer._id}`);
    console.log(`   Patient: ${transfer.nam} (${transfer.pid})`);
    console.log(`   Status: ${transfer.status}`);

    // Generate the QR payload (compressed)
    const qrPayload = {
      _id: transfer._id.toString(),
      pid: transfer.pid,
      nam: transfer.nam,
      age: transfer.age,
      pd: transfer.pd,
      rt: transfer.rt,
      alg: transfer.alg,
      med: transfer.med,
      vit: transfer.vit,
      pi: transfer.pi,
      sum: transfer.sum,
    };

    console.log('\n── Raw JSON Payload ──');
    console.log(JSON.stringify(qrPayload, null, 2));

    if (LZString) {
      const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(qrPayload));
      console.log('\n── LZ-String Compressed Payload (for QR code) ──');
      console.log(compressed);
      console.log(`\n📊 Compression: ${JSON.stringify(qrPayload).length} chars → ${compressed.length} chars`);
      console.log('   Copy the compressed string above into a QR code generator to test scanning.');
    }

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seed();
