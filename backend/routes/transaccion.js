const express = require('express');
const router = express.Router();
const { getTransacciones, getHistorial, postNuevaTransaccion, putTransaccion, deleteTransaccion} = require('../controllers/transaccionController');
const { verificarToken } = require('../middleware/auth');
const { validarTransaccion } = require('../middleware/transaccion-validator.middleware');

// Todas las rutas de transacciones requieren autenticación
router.use(verificarToken);

// GET /api/transacciones - Mostrar todas las transacciones
router.get('/', getTransacciones);

// GET /api/historial - Resumen agrupado por mes
router.get('/historial', getHistorial);

// POST /api/transacciones - Crear nuevas transacciones
router.get('/', validarTransaccion, postNuevaTransaccion);

// PUT /api/transacciones/:id - Modificar una transaccion por id
router.put('/:id', validarTransaccion, putTransaccion);

// DELETE /api/transacciones/:id - Eliminar una transaccion por id
router.delete('/:id', deleteTransaccion);

module.exports = router;