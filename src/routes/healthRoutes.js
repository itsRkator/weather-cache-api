/**
 * Health routes configuration
 */

const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

// GET /health - Basic health check
router.get('/', healthController.getHealth);

// GET /health/detailed - Detailed health check with dependencies
router.get('/detailed', healthController.getDetailedHealth);

module.exports = router;
