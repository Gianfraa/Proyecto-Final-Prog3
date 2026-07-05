jest.mock('../config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  },
  CACHE_TTL: { BALANCE: 300, RESUMEN: 300, ESTADISTICAS: 300 },
  CACHE_KEYS: {
    balance: (id) => `balance:user:${id}`,
    resumen: (id) => `resumen:user:${id}`,
    estadisticas: (id) => `estadisticas:user:${id}`,
  }
}));

jest.mock('../dist/models', () => ({
  Transaccion: {
    findAll: jest.fn(),
  },
  Categoria: {}
}));


const { getBalance, getResumen, getEstadisticas } = require('../controllers/dashboardController');
const { Transaccion } = require('../dist/models');
const { redisClient } = require('../config/redis');



function crearReqRes(query = {}, userId = 1) {
  const req = { query, user: { id: userId } };
  const res = {
    statusCode: 200,
    _json: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this._json = data; return this; }
  };
  return { req, res };
}


describe('DASHBOARD — getBalance', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calcula el balance correctamente desde la BD', async () => {
    redisClient.get.mockResolvedValue(null); // sin caché

    Transaccion.findAll.mockResolvedValue([
      { tipo: 'ingreso', monto: '1000' },
      { tipo: 'ingreso', monto: '500' },
      { tipo: 'gasto', monto: '300' },
    ]);

    const { req, res } = crearReqRes();
    await getBalance(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.totalIngresos).toBe(1500);
    expect(res._json.totalGastos).toBe(300);
    expect(res._json.balance).toBe(1200);
    expect(res._json.fromCache).toBe(false);
  });

  test('devuelve datos desde el caché si existen', async () => {
    const datosCache = { balance: 1200, totalIngresos: 1500, totalGastos: 300 };
    redisClient.get.mockResolvedValue(JSON.stringify(datosCache));

    const { req, res } = crearReqRes();
    await getBalance(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.fromCache).toBe(true);
    expect(res._json.balance).toBe(1200);    
    expect(Transaccion.findAll).not.toHaveBeenCalled();
  });

  test('balance es 0 si no hay transacciones', async () => {
    redisClient.get.mockResolvedValue(null);
    Transaccion.findAll.mockResolvedValue([]);

    const { req, res } = crearReqRes();
    await getBalance(req, res);

    expect(res._json.balance).toBe(0);
    expect(res._json.totalIngresos).toBe(0);
    expect(res._json.totalGastos).toBe(0);
  });

  test('guarda el resultado en caché después de calcularlo', async () => {
    redisClient.get.mockResolvedValue(null);
    Transaccion.findAll.mockResolvedValue([{ tipo: 'ingreso', monto: '500' }]);

    const { req, res } = crearReqRes();
    await getBalance(req, res);

    expect(redisClient.setEx).toHaveBeenCalledWith(
      'balance:user:1',
      300,
      expect.any(String)
    );
  });

  test('devuelve 500 si ocurre un error en la BD', async () => {
    redisClient.get.mockResolvedValue(null);
    Transaccion.findAll.mockRejectedValue(new Error('DB error'));

    const { req, res } = crearReqRes();
    await getBalance(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al obtener el balance');
  });
});


describe('DASHBOARD — getResumen', () => {
  beforeEach(() => jest.clearAllMocks());

  test('devuelve el resumen del mes actual', async () => {
    redisClient.get.mockResolvedValue(null);

    const transaccionesMock = [
      { tipo: 'ingreso', monto: '2000', categoria: null },
      { tipo: 'gasto', monto: '400', categoria: { id: 1, nombre: 'Comida' } },
      { tipo: 'gasto', monto: '100', categoria: { id: 1, nombre: 'Comida' } },
    ];
    Transaccion.findAll.mockResolvedValue(transaccionesMock);

    const { req, res } = crearReqRes();
    await getResumen(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.totalIngresos).toBe(2000);
    expect(res._json.totalGastos).toBe(500);
    expect(res._json.balance).toBe(1500);
    expect(res._json.cantidadTransacciones).toBe(3);
    expect(res._json.gastosPorCategoria['Comida']).toBe(500);
    expect(res._json.fromCache).toBe(false);
  });

  test('devuelve datos desde caché si existen', async () => {
    const datosCache = {
      mes: '2025-06', totalIngresos: 2000, totalGastos: 500,
      balance: 1500, cantidadTransacciones: 3, gastosPorCategoria: { Comida: 500 }
    };
    redisClient.get.mockResolvedValue(JSON.stringify(datosCache));

    const { req, res } = crearReqRes();
    await getResumen(req, res);

    expect(res._json.fromCache).toBe(true);
    expect(Transaccion.findAll).not.toHaveBeenCalled();
  });

  test('acepta el parámetro ?mes= para filtrar un mes específico', async () => {
    redisClient.get.mockResolvedValue(null);
    Transaccion.findAll.mockResolvedValue([]);

    const { req, res } = crearReqRes({ mes: '2025-01' });
    await getResumen(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.mes).toBe('2025-01');
  });

  test('agrupa gastos sin categoría como "Sin categoria"', async () => {
    redisClient.get.mockResolvedValue(null);
    Transaccion.findAll.mockResolvedValue([
      { tipo: 'gasto', monto: '200', categoria: null }
    ]);

    const { req, res } = crearReqRes();
    await getResumen(req, res);

    expect(res._json.gastosPorCategoria['Sin categoria']).toBe(200);
  });

  test('devuelve 500 si ocurre un error en la BD', async () => {
    redisClient.get.mockResolvedValue(null);
    Transaccion.findAll.mockRejectedValue(new Error('DB error'));

    const { req, res } = crearReqRes();
    await getResumen(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al obtener el resumen mensual');
  });
});

//Tests: Estadisticas 


describe('DASHBOARD — getEstadisticas', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calcula estadísticas correctamente', async () => {
    redisClient.get.mockResolvedValue(null);

    Transaccion.findAll.mockResolvedValue([
      { tipo: 'ingreso', monto: '3000', fecha: new Date('2025-06-01'), categoria: null },
      { tipo: 'gasto', monto: '600', fecha: new Date('2025-06-10'), categoria: { id: 1, nombre: 'Comida' } },
      { tipo: 'gasto', monto: '200', fecha: new Date('2025-06-15'), categoria: { id: 2, nombre: 'Transporte' } },
    ]);

    const { req, res } = crearReqRes();
    await getEstadisticas(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.totalTransacciones).toBe(3);
    expect(res._json.totalIngresos).toBe(3000);
    expect(res._json.totalGastos).toBe(800);
    expect(res._json.balance).toBe(2200);
    expect(res._json.promedioGasto).toBe(400); // 800 / 2 gastos
    expect(res._json.categoriaTopGasto.nombre).toBe('Comida');
    expect(res._json.categoriaTopGasto.total).toBe(600);
  });

  test('categoriaTopGasto es null si no hay gastos', async () => {
    redisClient.get.mockResolvedValue(null);
    Transaccion.findAll.mockResolvedValue([
      { tipo: 'ingreso', monto: '1000', fecha: new Date(), categoria: null }
    ]);

    const { req, res } = crearReqRes();
    await getEstadisticas(req, res);

    expect(res._json.categoriaTopGasto).toBeNull();
    expect(res._json.promedioGasto).toBe(0);
  });

  test('devuelve datos desde caché si existen', async () => {
    const datosCache = { totalTransacciones: 10, totalGastos: 500 };
    redisClient.get.mockResolvedValue(JSON.stringify(datosCache));

    const { req, res } = crearReqRes();
    await getEstadisticas(req, res);

    expect(res._json.fromCache).toBe(true);
    expect(Transaccion.findAll).not.toHaveBeenCalled();
  });

  test('devuelve la evolución mensual agrupada por mes', async () => {
    redisClient.get.mockResolvedValue(null);

    Transaccion.findAll.mockResolvedValue([
      { tipo: 'ingreso', monto: '1000', fecha: new Date('2025-05-01'), categoria: null },
      { tipo: 'gasto', monto: '300', fecha: new Date('2025-05-15'), categoria: null },
      { tipo: 'ingreso', monto: '2000', fecha: new Date('2025-06-01'), categoria: null },
    ]);

    const { req, res } = crearReqRes();
    await getEstadisticas(req, res);

    expect(res._json.evolucionMensual['2025-05']).toEqual({ ingresos: 1000, gastos: 300 });
    expect(res._json.evolucionMensual['2025-06']).toEqual({ ingresos: 2000, gastos: 0 });
  });

  test('devuelve 500 si ocurre un error en la BD', async () => {
    redisClient.get.mockResolvedValue(null);
    Transaccion.findAll.mockRejectedValue(new Error('DB error'));

    const { req, res } = crearReqRes();
    await getEstadisticas(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al obtener las estadisticas');
  });
});
