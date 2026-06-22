// Middleware con las validaciones necesarias para la simulación de una compra
const validarSimularCompra = (req, res, next) => {
  const { producto, precioTotal, cantidadCuotas, tasaInteresMensual, guardar } = req.body;

  if (!producto || typeof producto !== 'string' || producto.trim().length === 0) {
    return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
  }

  if (!precioTotal || typeof precioTotal !== 'number' || precioTotal <= 0) {
    return res.status(400).json({ error: 'El precio total debe ser un número válido mayor a 0' });
  }

  if (!Number.isInteger(cantidadCuotas) || cantidadCuotas < 1 || cantidadCuotas > 48) {
    return res.status(400).json({ error: 'La cantidad de cuotas debe ser un entero entre 1 y 48' });
  }

  if (tasaInteresMensual !== undefined && tasaInteresMensual !== null && tasaInteresMensual < 0) {
    return res.status(400).json({ error: 'La tasa de interés mensual debe ser un número válido mayor a 0' });
  }

  next();
};

module.exports = { validarSimularCompra };