const { op } = require('sequelize');
const { Simulacion } = require('../models');

// GET /api/simulaciones
const getSimulaciones = async (req, res) => {
  try {
    const userId = req.user.id;
    const simulaciones = await Simulacion.findAll({
      where: { userId },
        order: [['createdAt', 'DESC']]
    });
    res.json({ simulaciones });
  } catch (error) {
    console.error('Error en getSimulaciones:', error);
    res.status(500).json({ error: 'Error al obtener simulaciones' });
  }
};

// POST /api/simulaciones
const postSimulacion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { producto, precioTotal, cantidadCuotas, tasaInteresMensual } = req.body;
    const simulacion = await Simulacion.create({
      userId,
      producto,
      precioTotal,
      cantidadCuotas,
      tasaInteresMensual
    });
    res.status(201).json({ simulacion });
  } catch (error) {
    console.error('Error en postSimulacion:', error);
    res.status(500).json({ error: 'Error al crear simulacion' });
  }
};

// DELETE /api/simulaciones/:id
const deleteSimulacion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const simulacion = await Simulacion.findOne({
      where: { id, userId }
    });
    if (!simulacion) {
      return res.status(404).json({ error: 'Simulacion no encontrada' });
    }
    await simulacion.destroy();
    res.json({ message: 'Simulacion eliminada correctamente' });
  } catch (error) {
    console.error('Error en deleteSimulacion:', error);
    res.status(500).json({ error: 'Error al eliminar simulacion' });
  }
};

module.exports = { getSimulaciones, postSimulacion, deleteSimulacion };