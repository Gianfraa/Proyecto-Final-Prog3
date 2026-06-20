const { calcularCuotas } = require('../utils/simuladorHelpers');
const { Transaccion, Simulacion } = require('../models');
const { redisClient, CACHE_TTL, CACHE_KEYS } = require('../config/redis');


//POST /api/simulador/comprar

const postSimularCompra = async (req, res) => {
  try {
    const { producto, precioTotal, cantidadCuotas, tasaInteresMensual, guardar } = req.body;
    const userId = req.user.id;

    const tasa = typeof tasaInteresMensual === 'number' && tasaInteresMensual >= 0 ? tasaInteresMensual : 0;

    // --- Calcular cuotas ---
    const resultado = calcularCuotas(precioTotal, cantidadCuotas, tasa);

    const data = {
      producto: producto.trim(),
      precioTotal,
      cantidadCuotas,
      tasaInteresMensual: tasa,
      valorCuota: resultado.valorCuota,
      totalFinanciado: resultado.totalFinanciado,
      impactoBalanceMensual: -resultado.valorCuota,
      cuotas: resultado.cuotas,
    };

    if (guardar) {
      try {
        const { Simulacion } = require('../models');
        if (Simulacion) {
          const simulacion = await Simulacion.create({
            userId,
            producto: data.producto,
            precioTotal,
            cantidadCuotas,
            tasaInteresMensual: tasa,
            valorCuota: resultado.valorCuota,
            totalFinanciado: resultado.totalFinanciado,
            activa: true,
          });
          data.id = simulacion.id;
          data.guardada = true;
        }
      } catch (err) {
        console.warn('Modelo Simulacion no disponible, simulación no guardada:', err.message);
        data.guardada = false;
      }
    }

    return res.json({ data });
  } catch (error) {
    console.error('Error en postSimularCompra:', error);
    return res.status(500).json({ error: 'Error al simular la compra' });
  }
};

// --------------------------------------------
// Helpers para el balance consolidado (sanger)
// Cuenta cuántos meses calendario (año+mes) pasaron entre dos fechas.
// Se usa para saber cuántas cuotas de una simulación ya "vencieron".
function mesesTranscurridos(desde, hasta) {
  const d = new Date(desde);
  const h = new Date(hasta);
  return (h.getFullYear() - d.getFullYear()) * 12 + (h.getMonth() - d.getMonth());
}

function redondear(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}


// --------------------------------------------
// GET /api/balance-consolidado (sanger)
// Integra transacciones reales + simulaciones activas en una proyección a 6 meses.
const getBalanceConsolidado = async (req, res) => {
  const userId = req.user.id;
  const cacheKey = CACHE_KEYS.balanceConsolidado(userId);

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({ data: { ...JSON.parse(cached), fromCache: true } });
    }
  } catch (err) {
    console.error('Error leyendo cache de balance consolidado:', err.message);
  }

  try {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

    const transacciones = await Transaccion.findAll({ where: { userId } });

    // a) balanceActual: misma lógica que dashboardController.getBalance
    const totalIngresos = transacciones
      .filter((t) => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + parseFloat(t.monto), 0);
    const totalGastos = transacciones
      .filter((t) => t.tipo === 'gasto')
      .reduce((sum, t) => sum + parseFloat(t.monto), 0);
    const balanceActual = redondear(totalIngresos - totalGastos);

    // b) y c) ingresos/gastos fijos
    const ingresosFijosMensuales = redondear(
      transacciones
        .filter((t) => t.tipo === 'ingreso' && t.naturaleza === 'fijo')
        .reduce((sum, t) => sum + parseFloat(t.monto), 0)
    );
    const gastosFijosMensuales = redondear(
      transacciones
        .filter((t) => t.tipo === 'gasto' && t.naturaleza === 'fijo')
        .reduce((sum, t) => sum + parseFloat(t.monto), 0)
    );

    // Gastos variables: sólo el mes en curso (no son recurrentes)
    const gastosVariablesMesActual = redondear(
      transacciones
        .filter((t) => {
          const fecha = new Date(t.fecha);
          return (
            t.tipo === 'gasto' &&
            t.naturaleza === 'variable' &&
            fecha >= inicioMes &&
            fecha <= finMes
          );
        })
        .reduce((sum, t) => sum + parseFloat(t.monto), 0)
    );

    // d) Simulaciones activas
    const simulaciones = await Simulacion.findAll({ where: { userId, activa: true } });

    const simulacionesConProgreso = simulaciones.map((s) => {
      const transcurridos = Math.max(0, mesesTranscurridos(s.createdAt, ahora));
      const cantidadCuotas = s.cantidadCuotas;
      const cuotasRestantes = Math.max(0, cantidadCuotas - transcurridos);
      const valorCuota = redondear(parseFloat(s.valorCuota));

      return {
        id: s.id,
        producto: s.producto,
        cuotaMensual: valorCuota,
        cuotasRestantes,
        totalRestante: redondear(valorCuota * cuotasRestantes),
        _transcurridos: transcurridos,
        _cantidadCuotas: cantidadCuotas,
      };
    });

    // e) Proyección a 6 meses: ingresosFijos - gastosFijos - cuotasSimuladas
    const proyeccionMensual = [];
    let balanceNetoProyectado = 0;

    for (let offset = 1; offset <= 6; offset++) {
      const fechaMes = new Date(ahora.getFullYear(), ahora.getMonth() + offset, 1);
      const mesLabel = fechaMes.toISOString().slice(0, 7);

      const cuotasSimuladas = redondear(
        simulacionesConProgreso.reduce((sum, s) => {
          const transcurridosEnEseMes = s._transcurridos + offset;
          return transcurridosEnEseMes <= s._cantidadCuotas ? sum + s.cuotaMensual : sum;
        }, 0)
      );

      const balanceProyectado = redondear(
        ingresosFijosMensuales - gastosFijosMensuales - cuotasSimuladas
      );

      proyeccionMensual.push({
        mes: mesLabel,
        ingresosFijos: ingresosFijosMensuales,
        gastosFijos: gastosFijosMensuales,
        cuotasSimuladas,
        balanceProyectado,
      });

      balanceNetoProyectado += balanceProyectado;
    }
    balanceNetoProyectado = redondear(balanceNetoProyectado);

    const simulacionesActivas = simulacionesConProgreso.map(
      ({ _transcurridos, _cantidadCuotas, ...resto }) => resto
    );

    const data = {
      balanceActual,
      ingresosFijosMensuales,
      gastosFijosMensuales,
      gastosVariablesMesActual,
      simulacionesActivas,
      proyeccionMensual,
      balanceNetoProyectado,
    };

    // 4.4: cachear por 5 minutos
    try {
      await redisClient.setEx(cacheKey, CACHE_TTL.BALANCE_CONSOLIDADO, JSON.stringify(data));
    } catch (err) {
      console.error('Error guardando cache de balance consolidado:', err.message);
    }

    return res.json({ data: { ...data, fromCache: false } });
  } catch (error) {
    console.error('Error en getBalanceConsolidado:', error);
    return res.status(500).json({ error: 'Error al obtener el balance consolidado' });
  }
};

module.exports = { postSimularCompra, getBalanceConsolidado };