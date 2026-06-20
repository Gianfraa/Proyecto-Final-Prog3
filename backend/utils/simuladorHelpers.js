



function calcularCuotas(precioTotal, cantidadCuotas, tasaInteresMensual, fechaInicio) {
  const n = Math.max(1, Math.floor(cantidadCuotas));
  const i = Math.max(0, tasaInteresMensual || 0) / 100;
  const inicio = fechaInicio ? new Date(fechaInicio) : new Date();

  let valorCuota;
  let totalFinanciado;

  if (i === 0) {
    // Sin interés: cada cuota es precioTotal / n
    valorCuota = precioTotal / n;
    totalFinanciado = precioTotal;
  } else {
    // Amortización francés: cuota = P * [ i * (1+i)^n ] / [ (1+i)^n - 1 ] (formula  sacada de google)
    const factor = Math.pow(1 + i, n);
    valorCuota = precioTotal * (i * factor) / (factor - 1);
    totalFinanciado = valorCuota * n;
  }

  const cuotas = [];
  let saldoRestante = precioTotal;

  for (let mes = 1; mes <= n; mes++) {
    const interesCuota = saldoRestante * i;
    const amortizacionCuota = valorCuota - interesCuota;
    saldoRestante -= amortizacionCuota;

    // Ajustar saldo restante para que no quede negativo por redondeo
    if (saldoRestante < 0.01) {
      saldoRestante = 0;
    }

    // Calcular fecha de vencimiento (mes actual + offset de meses)
    const fechaVencimiento = new Date(inicio);
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + mes);

    cuotas.push({
      mes,
      fecha: fechaVencimiento.toISOString().slice(0, 10),
      valorCuota: redondear(valorCuota),
      interes: redondear(interesCuota),
      amortizacion: redondear(amortizacionCuota),
      saldoRestante: redondear(saldoRestante),
    });
  }

  return {
    valorCuota: redondear(valorCuota),
    totalFinanciado: redondear(totalFinanciado),
    cuotas,
  };
}

/**
 * Redondea un número a 2 decimales.
 */
function redondear(valor) {
  return Math.round(valor * 100) / 100;
}

module.exports = { calcularCuotas };