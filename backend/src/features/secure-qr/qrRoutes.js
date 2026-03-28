/**
 * Add these two lines to your existing server.js:
 *  * 
 */

const express = require('express');
const { generateToken, validateScan } = require('./qrController');

const router = express.Router();

router.post('/generate', generateToken);
router.get('/validate/:uuid', validateScan);

module.exports = router;
