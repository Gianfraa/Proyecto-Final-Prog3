const express = require('express');
const router = express.Router();
const { postSimularCompra, getBalanceConsolidado } = require('../controllers/gastosController');
const { verificarToken } = require('../middleware/auth');
const { validarSimularCompra } = require('../middleware/simulacion');

router.use(verificarToken);

router.post('/simulador/comprar', validarSimularCompra, postSimularCompra);

router.get('/balance-consolidado', getBalanceConsolidado);

module.exports = router;