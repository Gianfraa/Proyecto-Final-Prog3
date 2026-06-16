const { Op } = require('sequelize');
const { Transaccion, Categoria } = require('../dist/models');

// GET /api/transacciones

const getTransacciones = async (req, res) => {
  try {
    const { categoria, desde, hasta, tipo, q, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const where = { userId };

    // Filtro por categoría
    if (categoria) {
      where.categoriaId = parseInt(categoria, 10);
    }

    // Filtro por rango de fechas
    if (desde || hasta) {
      where.fecha = {};
      if (desde) {
        where.fecha[Op.gte] = new Date(desde);
      }
      if (hasta) {
        const fechaHasta = new Date(hasta);
        fechaHasta.setHours(23, 59, 59, 999);
        where.fecha[Op.lte] = fechaHasta;
      }
    }

    // Filtro por tipo (ingreso / gasto)
    if (tipo) {
      const tiposValidos = ['ingreso', 'gasto'];
      if (!tiposValidos.includes(tipo.toLowerCase())) {
        return res.status(400).json({ error: 'Tipo inválido. Use "ingreso" o "gasto"' });
      }
      where.tipo = tipo.toLowerCase();
    }

    // Busqueda por texto en descripción
    if (q) {
      where.descripcion = { [Op.iLike]: `%${q}%` };
    }

    // Paginación
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Transaccion.findAndCountAll({
      where,
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre']
        }
      ],
      order: [['fecha', 'DESC']],
      limit: limitNum,
      offset
    });

    const totalPaginas = Math.ceil(count / limitNum);

    res.json({
      data: rows,
      meta: {
        total: count,
        pagina: pageNum,
        porPagina: limitNum,
        totalPaginas
      }
    });
  } catch (error) {
    console.error('Error en getTransacciones:', error);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
};

// GET /api/transacciones/historial
const getHistorial = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sequelize } = require('../models');

    // Agrupar por año y mes, calcular totales por tipo
    const historial = await Transaccion.findAll({
      where: { userId },
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha')), 'mes'],
        'tipo',
        [sequelize.fn('SUM', sequelize.col('monto')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']
      ],
      group: [
        sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha')),
        'tipo'
      ],
      order: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha')), 'DESC']
      ],
      raw: true
    });

    // Transformar el resultado en un formato amigable por mes
    const resumen = {};
    for (const fila of historial) {
      const mes = fila.mes.toISOString().slice(0, 7); 
      if (!resumen[mes]) {
        resumen[mes] = { mes, ingresos: 0, gastos: 0, cantidadIngresos: 0, cantidadGastos: 0 };
      }
      if (fila.tipo === 'ingreso') {
        resumen[mes].ingresos = parseFloat(fila.total);
        resumen[mes].cantidadIngresos = parseInt(fila.cantidad, 10);
      } else if (fila.tipo === 'gasto') {
        resumen[mes].gastos = parseFloat(fila.total);
        resumen[mes].cantidadGastos = parseInt(fila.cantidad, 10);
      }
    }

    const resultado = Object.values(resumen).map((m) => ({
      ...m,
      balance: m.ingresos - m.gastos
    }));

    res.json({ historial: resultado });
  } catch (error) {
    console.error('Error en getHistorial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

// POST /api/transacciones
const postNuevaTransaccion = async (req, res) => {
  try {
    const { descripcion, monto, tipo, fecha, categoriaId } = req.body;
    const userId = req.user.id;

    const nueva = await Transaccion.create({
      descripcion,
      monto,
      tipo,
      fecha: fecha ? new Date(fecha) : new Date(),
      userId,
      categoriaId: categoriaId || null
    });

    res.status(201).json({ data: nueva });
  } catch (error) {
    console.error('Error en postNuevaTransaccion:', error);
    res.status(500).json({ error: 'Error al crear transacción' });
  }
};

// PUT /api/transacciones/:id
const putTransaccion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { descripcion, monto, tipo, fecha, categoriaId } = req.body;

    const transaccion = await Transaccion.findOne({ where: { id, userId } });

    if (!transaccion) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    await transaccion.update({
      descripcion,
      monto,
      tipo,
      fecha: fecha ? new Date(fecha) : new Date(),
      categoriaId: categoriaId || null
    });

    await transaccion.reload({
      include: [{ model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] }]
    });

    res.json({ data: transaccion });
  } catch (error) {
      console.error('Error en putTransaccion:', error);
    res.status(500).json({ error: 'Error al actualizar transacción' });
  }
};

// DELETE /api/transacciones/:id
const deleteTransaccion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaccion = await Transaccion.findOne({ where: { id, userId } });

    if (!transaccion) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    await transaccion.destroy();

    res.json({ message: 'Transacción eliminada correctamente' });
  } catch (error) {
    console.error('Error en deleteTransaccion:', error);
    res.status(500).json({ error: 'Error al eliminar transacción' });
  }
};

module.exports = { getTransacciones, getHistorial, postNuevaTransaccion, putTransaccion, deleteTransaccion };