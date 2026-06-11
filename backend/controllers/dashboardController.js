// backend/controllers/dashboardController.js
const { Transaccion, Categoria } = require('../models');
const { redisClient, CACHE_TTL, CACHE_KEYS } = require('../config/redis');

// GET /api/balance
// Devuelve el balance actual del usuario (totalIngresos - totalGastos)
const getBalance = async (req, res) => {
    const userId = req.user.id;

    // Clave unica de cache para este usuario
    const cacheKey = CACHE_KEYS.balance(userId);

    // Intentar obtener el balance desde Redis antes de ir a la base de datos
    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            // Si existe en cache, devolverlo directamente sin consultar PostgreSQL
            return res.json({ ...JSON.parse(cached), fromCache: true });
        }
    } catch (err) {
        console.error('Error leyendo cache de balance:', err.message);
    }

    try {
        // Traer todas las transacciones del usuario desde la base de datos
        const transacciones = await Transaccion.findAll({
            where: { userId }
        });

        // Filtrar por tipo y sumar los montos
        // parseFloat es necesario porque PostgreSQL devuelve DECIMAL como string
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

        // Guardar el resultado en Redis con TTL de 5 minutos
        // La proxima vez que se pida el balance, se devuelve desde cache
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

// GET /api/resumen
// Devuelve el resumen del mes actual o del mes indicado por ?mes=2026-05
const getResumen = async (req, res) => {
    const userId = req.user.id;
    const cacheKey = CACHE_KEYS.resumen(userId);

    // Intentar obtener el resumen desde Redis
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

        // Determinar el rango de fechas a consultar
        const mesParam = req.query.mes;
        let inicio, fin;

        if (mesParam) {
            // Si se manda ?mes=2026-05, usar ese mes
            inicio = new Date(`${mesParam}-01`);
            // El dia 0 del mes siguiente equivale al ultimo dia del mes actual
            fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0, 23, 59, 59);
        } else {
            // Sin parametro, usar el mes actual
            const ahora = new Date();
            inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
        }

        // Traer transacciones del mes con su categoria asociada
        const transacciones = await Transaccion.findAll({
            where: {
                userId,
                // Op.between filtra registros dentro del rango de fechas
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

        // Agrupar gastos por nombre de categoria para ver en que se gasto mas
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

        // Guardar en Redis con TTL de 5 minutos
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

// GET /api/estadisticas
// Devuelve estadisticas generales del usuario: totales, promedios y evolucion mensual
const getEstadisticas = async (req, res) => {
    const userId = req.user.id;
    const cacheKey = CACHE_KEYS.estadisticas(userId);

    // Intentar obtener las estadisticas desde Redis
    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.json({ ...JSON.parse(cached), fromCache: true });
        }
    } catch (err) {
        console.error('Error leyendo cache de estadisticas:', err.message);
    }

    try {
        // Traer todas las transacciones del usuario ordenadas por fecha
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

        // Promedio de gasto por transaccion
        // El condicional evita dividir por cero si no hay gastos
        const promedioGasto = gastos.length > 0 ? totalGastos / gastos.length : 0;

        // Agrupar gastos por categoria
        const gastosPorCategoria = gastos.reduce((acc, t) => {
            const nombre = t.categoria ? t.categoria.nombre : 'Sin categoria';
            acc[nombre] = (acc[nombre] || 0) + parseFloat(t.monto);
            return acc;
        }, {});

        // Obtener la categoria con mayor gasto total
        // Object.entries convierte el objeto en array, sort ordena de mayor a menor
        const categoriaTopGasto = Object.entries(gastosPorCategoria)
            .sort((a, b) => b[1] - a[1])[0] || null;

        // Agrupar ingresos y gastos por mes para ver la evolucion en el tiempo
        const evolucionMensual = {};
        transacciones.forEach(t => {
            // Extraer el mes en formato "2026-05"
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
            // Si hay categoria top, devolver nombre y total, sino null
            categoriaTopGasto: categoriaTopGasto
                ? { nombre: categoriaTopGasto[0], total: parseFloat(categoriaTopGasto[1].toFixed(2)) }
                : null,
            gastosPorCategoria,
            evolucionMensual
        };

        // Guardar en Redis con TTL de 5 minutos
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