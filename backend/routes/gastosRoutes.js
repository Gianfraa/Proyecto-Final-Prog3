const express = require('express');
const router = express.Router();
const { postSimularCompra, getBalanceConsolidado } = require('../controllers/gastosController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.post('/simulador/comprar', postSimularCompra);

router.get('/balance-consolidado', getBalanceConsolidado);

module.exports = router;