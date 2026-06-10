const express = require('express');
const router = express.Router();
const { crearCategoria, listarCategorias, actualizarCategoria, eliminarCategoria } = require('../controllers/categoriaController');
const { verificarToken } = require('../middleware/auth');

router.post('/',      verificarToken, crearCategoria);
router.get('/',       verificarToken, listarCategorias);
router.put('/:id',    verificarToken, actualizarCategoria);
router.delete('/:id', verificarToken, eliminarCategoria);

module.exports = router;