// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getBalance, getResumen, getEstadisticas } = require('../controllers/dashboardController');
const { verificarToken } = require('../middleware/auth');

// Todas las rutas del dashboard requieren autenticacion
router.use(verificarToken);

// GET /api/balance
router.get('/balance', getBalance);

// GET /api/resumen  (acepta ?mes=2026-05)
router.get('/resumen', getResumen);

// GET /api/estadisticas
router.get('/estadisticas', getEstadisticas);

module.exports = router;