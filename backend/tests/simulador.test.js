jest.mock('../dist/models', () => ({
  Simulacion: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  }
}));

jest.mock('../config/redis', () => ({
  redisClient: {
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
  },
  CACHE_KEYS: {
    balanceConsolidado: (id) => `balance-consolidado:user:${id}`,
  }
}));


const { calcularCuotas } = require('../utils/simuladorHelpers');
const { getSimulaciones, postSimulacion, deleteSimulacion } = require('../controllers/simulacionController');
const { Simulacion } = require('../dist/models');
const { redisClient } = require('../config/redis');


function crearReqRes(body = {}, params = {}, userId = 1) {
  const req = { body, params, user: { id: userId } };
  const res = {
    statusCode: 200,
    _json: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this._json = data; return this; }
  };
  return { req, res };
}


describe('HELPER — calcularCuotas (sin interés)', () => {
  test('divide el precio total en cuotas iguales', () => {
    const resultado = calcularCuotas(1200, 12, 0);

    expect(resultado.valorCuota).toBe(100);
    expect(resultado.totalFinanciado).toBe(1200);
    expect(resultado.cuotas).toHaveLength(12);
  });

  test('cada cuota tiene el valor correcto (sin interés)', () => {
    const resultado = calcularCuotas(1000, 4, 0);

    resultado.cuotas.forEach((cuota) => {
      expect(cuota.valorCuota).toBe(250);
      expect(cuota.interes).toBe(0);
    });
  });

  test('el saldo restante llega a 0 al final', () => {
    const resultado = calcularCuotas(900, 3, 0);
    const ultimaCuota = resultado.cuotas[resultado.cuotas.length - 1];

    expect(ultimaCuota.saldoRestante).toBe(0);
  });

  test('funciona con 1 sola cuota', () => {
    const resultado = calcularCuotas(500, 1, 0);

    expect(resultado.valorCuota).toBe(500);
    expect(resultado.cuotas).toHaveLength(1);
    expect(resultado.cuotas[0].saldoRestante).toBe(0);
  });
});

describe('HELPER — calcularCuotas (con interés)', () => {
  test('el total financiado es mayor al precio con interés', () => {
    const resultado = calcularCuotas(1000, 12, 5); // 5% mensual

    expect(resultado.totalFinanciado).toBeGreaterThan(1000);
    expect(resultado.cuotas).toHaveLength(12);
  });

  test('la cuota con interés es mayor que sin interés', () => {
    const sinInteres = calcularCuotas(1200, 12, 0);
    const conInteres = calcularCuotas(1200, 12, 2);

    expect(conInteres.valorCuota).toBeGreaterThan(sinInteres.valorCuota);
  });

  test('genera la cantidad correcta de cuotas', () => {
    const resultado = calcularCuotas(5000, 6, 3);
    expect(resultado.cuotas).toHaveLength(6);
  });

  test('cada cuota tiene los campos requeridos', () => {
    const resultado = calcularCuotas(1000, 3, 1);

    resultado.cuotas.forEach((cuota) => {
      expect(cuota).toHaveProperty('mes');
      expect(cuota).toHaveProperty('fecha');
      expect(cuota).toHaveProperty('valorCuota');
      expect(cuota).toHaveProperty('interes');
      expect(cuota).toHaveProperty('amortizacion');
      expect(cuota).toHaveProperty('saldoRestante');
    });
  });

  test('las fechas de vencimiento están ordenadas cronológicamente', () => {
    const resultado = calcularCuotas(1200, 3, 0);
    const fechas = resultado.cuotas.map((c) => c.fecha);

    for (let i = 1; i < fechas.length; i++) {
      expect(fechas[i] > fechas[i - 1]).toBe(true);
    }
  });
});

describe('HELPER — calcularCuotas (casos límite)', () => {
  test('tasa negativa se trata como 0 (sin interés)', () => {
    const conTasaNegativa = calcularCuotas(1000, 4, -5);
    const sinInteres = calcularCuotas(1000, 4, 0);

    expect(conTasaNegativa.valorCuota).toBe(sinInteres.valorCuota);
  });

  test('cantidad de cuotas decimal se redondea hacia abajo', () => {
    const resultado = calcularCuotas(1000, 3.9, 0);
    expect(resultado.cuotas).toHaveLength(3);
  });

  test('redondea los valores a 2 decimales', () => {
    const resultado = calcularCuotas(1000, 3, 1.5);

    resultado.cuotas.forEach((cuota) => {
      // Verificar que tiene máximo 2 decimales
      const partes = cuota.valorCuota.toString().split('.');
      if (partes[1]) {
        expect(partes[1].length).toBeLessThanOrEqual(2);
      }
    });
  });
});


describe('SIMULADOR — getSimulaciones', () => {
  beforeEach(() => jest.clearAllMocks());

  test('devuelve la lista de simulaciones del usuario', async () => {
    const simulacionesMock = [
      { id: 1, producto: 'Televisor', precioTotal: 50000, cantidadCuotas: 12 },
      { id: 2, producto: 'Notebook', precioTotal: 120000, cantidadCuotas: 24 }
    ];
    Simulacion.findAll.mockResolvedValue(simulacionesMock);

    const { req, res } = crearReqRes();
    await getSimulaciones(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.simulaciones).toEqual(simulacionesMock);
    expect(Simulacion.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 1 } })
    );
  });

  test('devuelve lista vacía si el usuario no tiene simulaciones', async () => {
    Simulacion.findAll.mockResolvedValue([]);

    const { req, res } = crearReqRes();
    await getSimulaciones(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.simulaciones).toEqual([]);
  });

  test('devuelve 500 si ocurre un error inesperado', async () => {
    Simulacion.findAll.mockRejectedValue(new Error('DB error'));

    const { req, res } = crearReqRes();
    await getSimulaciones(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al obtener simulaciones');
  });
});

describe('SIMULADOR — postSimulacion', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea una simulación sin interés correctamente', async () => {
    const simulacionCreada = {
      id: 1,
      producto: 'Televisor',
      precioTotal: 12000,
      cantidadCuotas: 12,
      tasaInteresMensual: 0,
      valorCuota: 1000,
      totalFinanciado: 12000
    };
    Simulacion.create.mockResolvedValue(simulacionCreada);

    const { req, res } = crearReqRes({
      producto: 'Televisor',
      precioTotal: 12000,
      cantidadCuotas: 12,
      tasaInteresMensual: 0
    });
    await postSimulacion(req, res);

    expect(res.statusCode).toBe(201);
    expect(res._json.simulacion).toEqual(simulacionCreada);
    
    expect(redisClient.del).toHaveBeenCalled();
  });

  test('crea una simulación con interés correctamente', async () => {
    const simulacionCreada = {
      id: 2,
      producto: 'Notebook',
      precioTotal: 60000,
      cantidadCuotas: 6,
      tasaInteresMensual: 3,
      valorCuota: 10837.53,
      totalFinanciado: 65025.18
    };
    Simulacion.create.mockResolvedValue(simulacionCreada);

    const { req, res } = crearReqRes({
      producto: 'Notebook',
      precioTotal: 60000,
      cantidadCuotas: 6,
      tasaInteresMensual: 3
    });
    await postSimulacion(req, res);

    expect(res.statusCode).toBe(201);
    expect(res._json.simulacion.totalFinanciado).toBeGreaterThan(60000);
  });

  test('tasa undefined o null se trata como 0', async () => {
    Simulacion.create.mockResolvedValue({ id: 3, valorCuota: 500, totalFinanciado: 1000 });

    const { req, res } = crearReqRes({
      producto: 'Auriculares',
      precioTotal: 1000,
      cantidadCuotas: 2
      
    });
    await postSimulacion(req, res);

    expect(Simulacion.create).toHaveBeenCalledWith(
      expect.objectContaining({ tasaInteresMensual: 0 })
    );
  });

  test('devuelve 500 si ocurre un error inesperado', async () => {
    Simulacion.create.mockRejectedValue(new Error('DB error'));

    const { req, res } = crearReqRes({
      producto: 'Test',
      precioTotal: 1000,
      cantidadCuotas: 3
    });
    await postSimulacion(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al crear simulacion');
  });
});

describe('SIMULADOR — deleteSimulacion', () => {
  beforeEach(() => jest.clearAllMocks());

  test('elimina la simulación correctamente', async () => {
    const simulacionMock = {
      id: 1,
      destroy: jest.fn().mockResolvedValue(true)
    };
    Simulacion.findOne.mockResolvedValue(simulacionMock);

    const { req, res } = crearReqRes({}, { id: '1' });
    await deleteSimulacion(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._json.message).toBe('Simulacion eliminada correctamente');
    expect(simulacionMock.destroy).toHaveBeenCalled();
    expect(redisClient.del).toHaveBeenCalled();
  });

  test('devuelve 404 si la simulación no existe o no pertenece al usuario', async () => {
    Simulacion.findOne.mockResolvedValue(null);

    const { req, res } = crearReqRes({}, { id: '999' });
    await deleteSimulacion(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._json.error).toBe('Simulacion no encontrada');
  });

  test('devuelve 500 si ocurre un error inesperado', async () => {
    Simulacion.findOne.mockRejectedValue(new Error('DB error'));

    const { req, res } = crearReqRes({}, { id: '1' });
    await deleteSimulacion(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al eliminar simulacion');
  });
});
