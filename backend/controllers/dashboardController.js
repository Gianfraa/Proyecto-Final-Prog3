// backend/controllers/dashboardController.js
const { Transaccion, Categoria } = require('../dist/models');
const { redisClient, CACHE_TTL, CACHE_KEYS } = require('../config/redis');

const getBalance = async (req, res) => {
    const userId = req.user.id;

    const cacheKey = CACHE_KEYS.balance(userId);

    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.json({ ...JSON.parse(cached), fromCache: true });
        }
    } catch (err) {
        console.error('Error leyendo cache de balance:', err.message);
    }

    try {
        const transacciones = await Transaccion.findAll({
            where: { userId }
        });

        const totalIngresos = transacciones
            .filter(t => t.tipo === 'ingreso')
            .reduce((sum, t) => sum + parseFloat(t.monto), 0);

        const totalGastos = transacciones
            .filter(t => t.tipo === 'gasto')
            .reduce((sum, t) => sum + parseFloat(t.monto), 0);

        const data = {
            balance: parseFloat((totalIngresos - totalGastos).toFixed(2)),
            totalIngresos: parseFloat(totalIngresos.toFixed(2)),
            totalGastos: parseFloat(totalGastos.toFixed(2))
        };

        try {
            await redisClient.setEx(cacheKey, CACHE_TTL.BALANCE, JSON.stringify(data));
        } catch (err) {
            console.error('Error guardando cache de balance:', err.message);
        }

        res.json({ ...data, fromCache: false });
    } catch (error) {
        console.error('Error en getBalance:', error);
        res.status(500).json({ error: 'Error al obtener el balance' });
    }
};

const getResumen = async (req, res) => {
    const userId = req.user.id;
    const cacheKey = CACHE_KEYS.resumen(userId);

    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.json({ ...JSON.parse(cached), fromCache: true });
        }
    } catch (err) {
        console.error('Error leyendo cache de resumen:', err.message);
    }

    try {
        const { Op } = require('sequelize');

        const mesParam = req.query.mes;
        let inicio, fin;

        if (mesParam) {
            inicio = new Date(`${mesParam}-01`);
            fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0, 23, 59, 59);
        } else {
            const ahora = new Date();
            inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
        }
        const transacciones = await Transaccion.findAll({
            where: {
                userId,
                fecha: { [Op.between]: [inicio, fin] }
            },
            include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre']
            }]
        });

        const ingresos = transacciones.filter(t => t.tipo === 'ingreso');
        const gastos = transacciones.filter(t => t.tipo === 'gasto');

        const totalIngresos = ingresos.reduce((sum, t) => sum + parseFloat(t.monto), 0);
        const totalGastos = gastos.reduce((sum, t) => sum + parseFloat(t.monto), 0);

        const gastosPorCategoria = gastos.reduce((acc, t) => {
            const nombre = t.categoria ? t.categoria.nombre : 'Sin categoria';
            acc[nombre] = (acc[nombre] || 0) + parseFloat(t.monto);
            return acc;
        }, {});

        const data = {
            mes: inicio.toISOString().slice(0, 7),
            totalIngresos: parseFloat(totalIngresos.toFixed(2)),
            totalGastos: parseFloat(totalGastos.toFixed(2)),
            balance: parseFloat((totalIngresos - totalGastos).toFixed(2)),
            cantidadTransacciones: transacciones.length,
            gastosPorCategoria
        };

        try {
            await redisClient.setEx(cacheKey, CACHE_TTL.RESUMEN, JSON.stringify(data));
        } catch (err) {
            console.error('Error guardando cache de resumen:', err.message);
        }

        res.json({ ...data, fromCache: false });
    } catch (error) {
        console.error('Error en getResumen:', error);
        res.status(500).json({ error: 'Error al obtener el resumen mensual' });
    }
};

const getEstadisticas = async (req, res) => {
    const userId = req.user.id;
    const cacheKey = CACHE_KEYS.estadisticas(userId);

    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.json({ ...JSON.parse(cached), fromCache: true });
        }
    } catch (err) {
        console.error('Error leyendo cache de estadisticas:', err.message);
    }

    try {
        const transacciones = await Transaccion.findAll({
            where: { userId },
            include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre']
            }],
            order: [['fecha', 'ASC']]
        });

        const gastos = transacciones.filter(t => t.tipo === 'gasto');
        const ingresos = transacciones.filter(t => t.tipo === 'ingreso');

        const totalGastos = gastos.reduce((sum, t) => sum + parseFloat(t.monto), 0);
        const totalIngresos = ingresos.reduce((sum, t) => sum + parseFloat(t.monto), 0);

        const promedioGasto = gastos.length > 0 ? totalGastos / gastos.length : 0;

        const gastosPorCategoria = gastos.reduce((acc, t) => {
            const nombre = t.categoria ? t.categoria.nombre : 'Sin categoria';
            acc[nombre] = (acc[nombre] || 0) + parseFloat(t.monto);
            return acc;
        }, {});

        const categoriaTopGasto = Object.entries(gastosPorCategoria)
            .sort((a, b) => b[1] - a[1])[0] || null;

        const evolucionMensual = {};
        transacciones.forEach(t => {
            const mes = new Date(t.fecha).toISOString().slice(0, 7);
            if (!evolucionMensual[mes]) {
                evolucionMensual[mes] = { ingresos: 0, gastos: 0 };
            }
            evolucionMensual[mes][t.tipo === 'ingreso' ? 'ingresos' : 'gastos'] += parseFloat(t.monto);
        });

        const data = {
            totalTransacciones: transacciones.length,
            totalIngresos: parseFloat(totalIngresos.toFixed(2)),
            totalGastos: parseFloat(totalGastos.toFixed(2)),
            balance: parseFloat((totalIngresos - totalGastos).toFixed(2)),
            promedioGasto: parseFloat(promedioGasto.toFixed(2)),
            categoriaTopGasto: categoriaTopGasto
                ? { nombre: categoriaTopGasto[0], total: parseFloat(categoriaTopGasto[1].toFixed(2)) }
                : null,
            gastosPorCategoria,
            evolucionMensual
        };

        try {
            await redisClient.setEx(cacheKey, CACHE_TTL.ESTADISTICAS, JSON.stringify(data));
        } catch (err) {
            console.error('Error guardando cache de estadisticas:', err.message);
        }

        res.json({ ...data, fromCache: false });
    } catch (error) {
        console.error('Error en getEstadisticas:', error);
        res.status(500).json({ error: 'Error al obtener las estadisticas' });
    }
};

module.exports = { getBalance, getResumen, getEstadisticas };