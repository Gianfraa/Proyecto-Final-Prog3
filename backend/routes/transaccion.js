const express = require('express');
const router = express.Router();
const { getTransacciones, getHistorial } = require('../controllers/transaccionController');
const { verificarToken } = require('../middleware/auth');

// Todas las rutas de transacciones requieren autenticación
router.use(verificarToken);

// GET /api/transacciones
router.get('/', getTransacciones);

// GET /api/historial - Resumen agrupado por mes
router.get('/historial', getHistorial);

module.exports = router;