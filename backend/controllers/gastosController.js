const { calcularCuotas } = require('../utils/simuladorHelpers');
const { Transaccion, Simulacion } = require('../models');
const { redisClient, CACHE_TTL, CACHE_KEYS } = require('../config/redis');


 //POST /api/simulador/comprar
 
const postSimularCompra = async (req, res) => {
  try {
    const { producto, precioTotal, cantidadCuotas, tasaInteresMensual, guardar } = req.body;
    const userId = req.user.id;

    // --- Validaciones básicas ---
    if (!producto || typeof producto !== 'string' || producto.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
    }

    if (!precioTotal || typeof precioTotal !== 'number' || precioTotal <= 0) {
      return res.status(400).json({ error: 'El precio total debe ser un número mayor a 0' });
    }

    if (!cantidadCuotas || !Number.isInteger(cantidadCuotas) || cantidadCuotas < 1 || cantidadCuotas > 48) {
      return res.status(400).json({ error: 'La cantidad de cuotas debe ser un entero entre 1 y 48' });
    }

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


module.exports = { postSimularCompra };