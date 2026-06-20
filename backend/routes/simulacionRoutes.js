const express = require('express');
const router = express.Router();
const { getSimulaciones, postSimulacion, deleteSimulacion } = require('../controllers/simulacionController');
const { verificarToken } = require('../middleware/auth');
const { validarSimularCompra } = require('../middleware/simulacion');

router.use(verificarToken);

// GET /api/simulaciones - Mostrar todas las simulaciones del usuario autenticado
router.get('/', getSimulaciones);

// POST /api/simulaciones - Crear una nueva simulacion
router.post('/', postSimulacion, validarSimularCompra);

// DELETE /api/simulaciones/:id - Eliminar una simulacion por id
router.delete('/:id', deleteSimulacion);

module.exports = router;