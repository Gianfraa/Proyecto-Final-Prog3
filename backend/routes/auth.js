const express = require('express');
const router = express.Router();
const { register, login, perfil } = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

// POST /api/auth/register - Registro de usuario (pública)
router.post('/register', register);

// POST /api/auth/login - Inicio de sesión (pública)
router.post('/login', login);

// GET /api/auth/perfil - Obtener perfil (protegida)
router.get('/perfil', verificarToken, perfil);

module.exports = router;
