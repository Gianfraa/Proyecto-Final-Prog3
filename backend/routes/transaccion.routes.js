const express = require('express');
const router = express.Router();
const { getTransacciones, getHistorial } = require('../controllers/transaccion.controller');
const { verificarToken } = require('../middleware/auth-validator.middleware');

// Todas las rutas de transacciones requieren autenticación
router.use(verificarToken);

// GET /api/transacciones
router.get('/', getTransacciones);

// GET /api/transacciones/historial - Resumen agrupado por mes
router.get('/historial', getHistorial);

module.exports = router;