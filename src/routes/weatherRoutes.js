/**
 * Weather routes configuration
 */

const express = require('express');
const weatherController = require('../controllers/weatherController');

const router = express.Router();

// GET /weather?city=...
router.get('/', weatherController.getWeather);

// GET /weather/cache/stats - Get cache statistics
router.get('/cache/stats', weatherController.getCacheStats);

// DELETE /weather/cache - Clear cache
router.delete('/cache', weatherController.clearCache);

module.exports = router;
