jest.mock('../dist/models', () => ({
  Transaccion: {
    findAndCountAll: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Categoria: {},
  sequelize: {
    fn: jest.fn(),
    col: jest.fn(),
  }
}));

jest.mock('../config/redis', () => ({
  redisClient: {
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue(null),
    setEx: jest.fn().mockResolvedValue('OK'),
  },
  CACHE_KEYS: {
    balance: (id) => `balance:user:${id}`,
    resumen: (id) => `resumen:user:${id}`,
    estadisticas: (id) => `estadisticas:user:${id}`,
    balanceConsolidado: (id) => `balance-consolidado:user:${id}`,
  },
  CACHE_TTL: { BALANCE: 300, RESUMEN: 300, ESTADISTICAS: 300, BALANCE_CONSOLIDADO: 300 }
}));


const {
  getTransacciones,
  postNuevaTransaccion,
  putTransaccion,
  deleteTransaccion
} = require('../controllers/transaccionController');
const { Transaccion } = require('../dist/models');
const { redisClient } = require('../config/redis');


function crearReqRes(body = {}, params = {}, query = {}, userId = 1) {
  const req = { body, params, query, user: { id: userId } };
  const res = {
    statusCode: 200,
    _json: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this._json = data; return this; }
  };
  return { req, res };
}


describe('TRANSACCIONES — getTransacciones', () => {
  beforeEach(() => jest.clearAllMocks());

  test('devuelve la lista paginada de transacciones', async () => {
    const filas = [
      { id: 1, descripcion: 'Sueldo', monto: 1000, tipo: 'ingreso', naturaleza: 'fijo' },
      { id: 2, descripcion: 'Supermercado', monto: 200, tipo: 'gasto', naturaleza: 'variable' }
    ];
    Transaccion.findAndCountAll.mockResolvedValue({ count: 2, rows: filas });

    const { req, res } = crearReqRes({}, {}, {});
    await getTransacciones(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.data).toEqual(filas);
    expect(res._json.meta.total).toBe(2);
    expect(res._json.meta.pagina).toBe(1);
  });

  test('devuelve 400 si el tipo de filtro es inválido', async () => {
    const { req, res } = crearReqRes({}, {}, { tipo: 'invalido' });
    await getTransacciones(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._json.error).toMatch(/Tipo inválido/);
    expect(Transaccion.findAndCountAll).not.toHaveBeenCalled();
  });

  test('devuelve 400 si la naturaleza de filtro es inválida', async () => {
    const { req, res } = crearReqRes({}, {}, { naturaleza: 'mensual' });
    await getTransacciones(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._json.error).toMatch(/Naturaleza inválida/);
  });

  test('aplica paginación correctamente', async () => {
    Transaccion.findAndCountAll.mockResolvedValue({ count: 50, rows: [] });

    const { req, res } = crearReqRes({}, {}, { page: '3', limit: '5' });
    await getTransacciones(req, res);

    expect(res._json.meta.pagina).toBe(3);
    expect(res._json.meta.porPagina).toBe(5);
    expect(res._json.meta.totalPaginas).toBe(10);
  });

  test('devuelve 500 si ocurre un error inesperado', async () => {
    Transaccion.findAndCountAll.mockRejectedValue(new Error('DB error'));

    const { req, res } = crearReqRes();
    await getTransacciones(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al obtener transacciones');
  });
});



describe('TRANSACCIONES — postNuevaTransaccion', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea una transacción de tipo ingreso correctamente', async () => {
    const nuevaTransaccion = {
      id: 1, descripcion: 'Sueldo', monto: 1000, tipo: 'ingreso', naturaleza: 'fijo'
    };
    Transaccion.create.mockResolvedValue(nuevaTransaccion);

    const { req, res } = crearReqRes({
      descripcion: 'Sueldo',
      monto: 1000,
      tipo: 'ingreso',
      naturaleza: 'fijo',
      fecha: '2025-06-01',
      categoriaId: null
    });
    await postNuevaTransaccion(req, res);

    expect(res.statusCode).toBe(201);
    expect(res._json.data).toEqual(nuevaTransaccion);
    expect(redisClient.del).toHaveBeenCalledTimes(4); // invalida 4 claves de cache
  });

  test('crea una transacción de tipo gasto correctamente', async () => {
    const nuevaTransaccion = {
      id: 2, descripcion: 'Netflix', monto: 500, tipo: 'gasto', naturaleza: 'fijo'
    };
    Transaccion.create.mockResolvedValue(nuevaTransaccion);

    const { req, res } = crearReqRes({
      descripcion: 'Netflix',
      monto: 500,
      tipo: 'gasto',
      naturaleza: 'fijo',
      categoriaId: 3
    });
    await postNuevaTransaccion(req, res);

    expect(res.statusCode).toBe(201);
    expect(res._json.data).toEqual(nuevaTransaccion);
  });

  test('asigna naturaleza "variable" por defecto si no se envía', async () => {
    Transaccion.create.mockResolvedValue({ id: 3, naturaleza: 'variable' });

    const { req, res } = crearReqRes({
      descripcion: 'Compra',
      monto: 100,
      tipo: 'gasto'     
    });
    await postNuevaTransaccion(req, res);

    expect(Transaccion.create).toHaveBeenCalledWith(
      expect.objectContaining({ naturaleza: 'variable' })
    );
  });

  test('devuelve 500 si ocurre un error inesperado', async () => {
    Transaccion.create.mockRejectedValue(new Error('DB error'));

    const { req, res } = crearReqRes({ descripcion: 'Test', monto: 100, tipo: 'gasto' });
    await postNuevaTransaccion(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al crear transacción');
  });
});

describe('TRANSACCIONES — putTransaccion', () => {
  beforeEach(() => jest.clearAllMocks());

  test('actualiza la transacción correctamente', async () => {
    const transaccionMock = {
      id: 1,
      descripcion: 'Sueldo viejo',
      update: jest.fn().mockResolvedValue(true),
      reload: jest.fn().mockResolvedValue(true)
    };
    Transaccion.findOne.mockResolvedValue(transaccionMock);

    const { req, res } = crearReqRes(
      { descripcion: 'Sueldo nuevo', monto: 1500, tipo: 'ingreso', naturaleza: 'fijo' },
      { id: '1' }
    );
    await putTransaccion(req, res);

    expect(res.statusCode).toBe(200);
    expect(transaccionMock.update).toHaveBeenCalled();
    expect(transaccionMock.reload).toHaveBeenCalled();
    expect(redisClient.del).toHaveBeenCalledTimes(4);
  });

  test('devuelve 404 si la transacción no existe o no pertenece al usuario', async () => {
    Transaccion.findOne.mockResolvedValue(null);

    const { req, res } = crearReqRes(
      { descripcion: 'Test', monto: 100, tipo: 'gasto' },
      { id: '999' }
    );
    await putTransaccion(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._json.error).toBe('Transacción no encontrada');
  });

  test('devuelve 500 si ocurre un error inesperado', async () => {
    Transaccion.findOne.mockRejectedValue(new Error('DB error'));

    const { req, res } = crearReqRes({ descripcion: 'Test' }, { id: '1' });
    await putTransaccion(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al actualizar transacción');
  });
});

describe('TRANSACCIONES — deleteTransaccion', () => {
  beforeEach(() => jest.clearAllMocks());

  test('elimina la transacción correctamente', async () => {
    const transaccionMock = {
      id: 1,
      destroy: jest.fn().mockResolvedValue(true)
    };
    Transaccion.findOne.mockResolvedValue(transaccionMock);

    const { req, res } = crearReqRes({}, { id: '1' });
    await deleteTransaccion(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.message).toBe('Transacción eliminada correctamente');
    expect(transaccionMock.destroy).toHaveBeenCalled();
    expect(redisClient.del).toHaveBeenCalledTimes(4);
  });

  test('devuelve 404 si la transacción no existe o no pertenece al usuario', async () => {
    Transaccion.findOne.mockResolvedValue(null);

    const { req, res } = crearReqRes({}, { id: '999' });
    await deleteTransaccion(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._json.error).toBe('Transacción no encontrada');
  });

  test('devuelve 500 si ocurre un error inesperado', async () => {
    Transaccion.findOne.mockRejectedValue(new Error('DB error'));

    const { req, res } = crearReqRes({}, { id: '1' });
    await deleteTransaccion(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al eliminar transacción');
  });
});
