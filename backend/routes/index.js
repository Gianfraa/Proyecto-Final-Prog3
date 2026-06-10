const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const transaccionRoutes = require('./transaccionRoutes');
const categoriaRoutes = require('./categoriaRoutes');

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

router.use('/auth', authRoutes);
router.use('/transacciones', transaccionRoutes);
router.use('/historial', transaccionRoutes);
router.use('/categorias', categoriaRoutes);

router.get('/test', (req, res) => {
  res.json({
    message: 'Endpoint de prueba',
    data: { backend: 'Express', database: 'PostgreSQL', orm: 'Sequelize' }
  });
});

module.exports = router;