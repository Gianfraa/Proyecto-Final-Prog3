const express = require('express');
const router = express.Router();
const { postSimularCompra, getBalanceConsolidado } = require('../controllers/gastosController');
const { verificarToken } = require('../middleware/auth');
const { validarSimularCompra } = require('../middleware/simulacion');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// POST /api/simulador/comprar
// Simula una compra en cuotas y opcionalmente la guarda
router.post('/simulador/comprar', postSimularCompra, validarSimularCompra);

// GET /api/balance-consolidado
// Balance actual + ingresos/gastos fijos + simulaciones activas, proyectado a 6 meses
router.get('/balance-consolidado', getBalanceConsolidado);

module.exports = router;