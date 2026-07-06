const { validateTransaccion } = require('../middleware/transaccion');
const { validarSimularCompra } = require('../middleware/simulacion');


function crearReqRes(body = {}) {
  const req = { body };
  const res = {
    statusCode: 200,
    _json: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this._json = data; return this; }
  };
  const next = jest.fn();
  return { req, res, next };
}


describe('MIDDLEWARE — validateTransaccion', () => {
  test('llama next() con datos válidos', () => {
    const { req, res, next } = crearReqRes({
      descripcion: 'Sueldo',
      monto: 1000,
      tipo: 'ingreso'
    });
    validateTransaccion(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  test('acepta tipo "gasto" y fecha válida', () => {
    const { req, res, next } = crearReqRes({
      descripcion: 'Supermercado',
      monto: 500,
      tipo: 'gasto',
      fecha: '2025-06-01'
    });
    validateTransaccion(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('devuelve 400 si falta descripcion', () => {
    const { req, res, next } = crearReqRes({ monto: 100, tipo: 'ingreso' });
    validateTransaccion(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._json.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ param: 'descripcion' })
      ])
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('devuelve 400 si monto es 0 o negativo', () => {
    const { req, res, next } = crearReqRes({
      descripcion: 'Test',
      monto: -50,
      tipo: 'ingreso'
    });
    validateTransaccion(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._json.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ param: 'monto' })
      ])
    );
  });

  test('devuelve 400 si monto no es un número', () => {
    const { req, res, next } = crearReqRes({
      descripcion: 'Test',
      monto: 'no-es-numero',
      tipo: 'ingreso'
    });
    validateTransaccion(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._json.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ param: 'monto' })
      ])
    );
  });

  test('devuelve 400 si tipo no es "ingreso" ni "gasto"', () => {
    const { req, res, next } = crearReqRes({
      descripcion: 'Test',
      monto: 100,
      tipo: 'otro'
    });
    validateTransaccion(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._json.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ param: 'tipo' })
      ])
    );
  });

  test('devuelve 400 si la fecha no es válida', () => {
    const { req, res, next } = crearReqRes({
      descripcion: 'Test',
      monto: 100,
      tipo: 'ingreso',
      fecha: 'no-es-fecha'
    });
    validateTransaccion(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._json.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ param: 'fecha' })
      ])
    );
  });

  test('devuelve 400 si categoriaId no es entero', () => {
    const { req, res, next } = crearReqRes({
      descripcion: 'Test',
      monto: 100,
      tipo: 'ingreso',
      categoriaId: 'abc'
    });
    validateTransaccion(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._json.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ param: 'categoriaId' })
      ])
    );
  });

  test('acumula múltiples errores de validación', () => {
    // Sin descripción ni tipo válido
    const { req, res, next } = crearReqRes({ monto: 100 });
    validateTransaccion(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._json.errors.length).toBeGreaterThanOrEqual(2);
  });

  test('acepta categoriaId entero válido', () => {
    const { req, res, next } = crearReqRes({
      descripcion: 'Comida',
      monto: 200,
      tipo: 'gasto',
      categoriaId: 3
    });
    validateTransaccion(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

//Tests: validar Simular Compra 

describe('MIDDLEWARE — validarSimularCompra', () => {
  test('llama next() con datos válidos', () => {
    const { req, res, next } = crearReqRes({
      producto: 'Televisor',
      precioTotal: 50000,
      cantidadCuotas: 12,
      tasaInteresMensual: 3
    });
    validarSimularCompra(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('llama next() sin tasa de interés (es opcional)', () => {
    const { req, res, next } = crearReqRes({
      producto: 'Notebook',
      precioTotal: 80000,
      cantidadCuotas: 6
    });
    validarSimularCompra(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('devuelve 400 si producto está vacío', () => {
    const { req, res, next } = crearReqRes({
      producto: '   ',
      precioTotal: 1000,
      cantidadCuotas: 3
    });
    validarSimularCompra(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._json.error).toMatch(/producto/i);
    expect(next).not.toHaveBeenCalled();
  });

  test('devuelve 400 si producto no es string', () => {
    const { req, res, next } = crearReqRes({
      producto: 123,
      precioTotal: 1000,
      cantidadCuotas: 3
    });
    validarSimularCompra(req, res, next);

    expect(res.statusCode).toBe(400);
  });

  test('devuelve 400 si precioTotal es 0 o negativo', () => {
    const { req, res, next } = crearReqRes({
      producto: 'Televisor',
      precioTotal: -100,
      cantidadCuotas: 6
    });
    validarSimularCompra(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._json.error).toMatch(/precio/i);
  });

  test('devuelve 400 si precioTotal no es número', () => {
    const { req, res, next } = crearReqRes({
      producto: 'Televisor',
      precioTotal: 'gratis',
      cantidadCuotas: 6
    });
    validarSimularCompra(req, res, next);

    expect(res.statusCode).toBe(400);
  });

  test('devuelve 400 si cantidadCuotas es menor a 1', () => {
    const { req, res, next } = crearReqRes({
      producto: 'Televisor',
      precioTotal: 10000,
      cantidadCuotas: 0
    });
    validarSimularCompra(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._json.error).toMatch(/cuotas/i);
  });

  test('devuelve 400 si cantidadCuotas es mayor a 48', () => {
    const { req, res, next } = crearReqRes({
      producto: 'Televisor',
      precioTotal: 10000,
      cantidadCuotas: 60
    });
    validarSimularCompra(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._json.error).toMatch(/cuotas/i);
  });

  test('devuelve 400 si cantidadCuotas no es entero', () => {
    const { req, res, next } = crearReqRes({
      producto: 'Televisor',
      precioTotal: 10000,
      cantidadCuotas: 3.5
    });
    validarSimularCompra(req, res, next);

    expect(res.statusCode).toBe(400);
  });

  test('devuelve 400 si tasaInteresMensual es negativa', () => {
    const { req, res, next } = crearReqRes({
      producto: 'Televisor',
      precioTotal: 10000,
      cantidadCuotas: 6,
      tasaInteresMensual: -1
    });
    validarSimularCompra(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res._json.error).toMatch(/tasa/i);
  });

  test('acepta tasa de interés 0', () => {
    const { req, res, next } = crearReqRes({
      producto: 'Televisor',
      precioTotal: 10000,
      cantidadCuotas: 6,
      tasaInteresMensual: 0
    });
    validarSimularCompra(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('acepta cantidadCuotas en el límite máximo (48)', () => {
    const { req, res, next } = crearReqRes({
      producto: 'Auto',
      precioTotal: 500000,
      cantidadCuotas: 48
    });
    validarSimularCompra(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
