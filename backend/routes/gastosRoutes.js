const express = require('express');
const router = express.Router();
const { postSimularCompra } = require('../controllers/gastosController');
const { verificarToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// POST /api/simulador/comprar
// Simula una compra en cuotas y opcionalmente la guarda
router.post('/simulador/comprar', postSimularCompra);

module.exports = router;