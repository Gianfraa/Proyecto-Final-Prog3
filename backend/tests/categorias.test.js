
jest.mock('../dist/models', () => ({
  Categoria: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  }
}));

jest.mock('../utils/categoriaHelpers', () => ({
  limpiarNombre: jest.fn((nombre) => (nombre ? nombre.trim() : '')),
  existeNombreDuplicado: jest.fn(),
}));

const {
  crearCategoria,
  listarCategorias,
  actualizarCategoria,
  eliminarCategoria
} = require('../controllers/categoriaController');
const { Categoria } = require('../dist/models');
const { limpiarNombre, existeNombreDuplicado } = require('../utils/categoriaHelpers');

function crearReqRes(body = {}, params = {}) {
  const req = { body, params };
  const res = {
    statusCode: 200,
    _json: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this._json = data; return this; }
  };
  return { req, res };
}


describe('CATEGORIAS — crearCategoria', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea una categoría correctamente', async () => {
    limpiarNombre.mockReturnValue('Comida');
    existeNombreDuplicado.mockResolvedValue(false);
    Categoria.create.mockResolvedValue({ id: 1, nombre: 'Comida' });

    const { req, res } = crearReqRes({ nombre: 'Comida' });
    await crearCategoria(req, res);

    expect(res.statusCode).toBe(201);
    expect(res._json.message).toBe('Categoría creada exitosamente');
    expect(res._json.categoria).toEqual({ id: 1, nombre: 'Comida' });
    expect(Categoria.create).toHaveBeenCalledWith({ nombre: 'Comida' });
  });

  test('devuelve 400 si el nombre está vacío', async () => {
    limpiarNombre.mockReturnValue('');

    const { req, res } = crearReqRes({ nombre: '   ' });
    await crearCategoria(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._json.error).toBe('El nombre es obligatorio');
    expect(Categoria.create).not.toHaveBeenCalled();
  });

  test('devuelve 400 si ya existe una categoría con ese nombre', async () => {
    limpiarNombre.mockReturnValue('Comida');
    existeNombreDuplicado.mockResolvedValue(true);

    const { req, res } = crearReqRes({ nombre: 'Comida' });
    await crearCategoria(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._json.error).toBe('Ya existe una categoría con ese nombre');
    expect(Categoria.create).not.toHaveBeenCalled();
  });

  test('devuelve 500 si ocurre un error inesperado', async () => {
    limpiarNombre.mockReturnValue('Comida');
    existeNombreDuplicado.mockResolvedValue(false);
    Categoria.create.mockRejectedValue(new Error('DB error'));

    const { req, res } = crearReqRes({ nombre: 'Comida' });
    await crearCategoria(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al crear la categoría');
  });
});


describe('CATEGORIAS — listarCategorias', () => {
  beforeEach(() => jest.clearAllMocks());

  test('devuelve la lista de categorías ordenada', async () => {
    const listaMock = [
      { id: 1, nombre: 'Comida' },
      { id: 2, nombre: 'Transporte' }
    ];
    Categoria.findAll.mockResolvedValue(listaMock);

    const { req, res } = crearReqRes();
    await listarCategorias(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.categorias).toEqual(listaMock);
    expect(Categoria.findAll).toHaveBeenCalledWith({ order: [['nombre', 'ASC']] });
  });

  test('devuelve lista vacía si no hay categorías', async () => {
    Categoria.findAll.mockResolvedValue([]);

    const { req, res } = crearReqRes();
    await listarCategorias(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.categorias).toEqual([]);
  });

  test('devuelve 500 si ocurre un error inesperado', async () => {
    Categoria.findAll.mockRejectedValue(new Error('DB error'));

    const { req, res } = crearReqRes();
    await listarCategorias(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al obtener las categorías');
  });
});



describe('CATEGORIAS — actualizarCategoria', () => {
  beforeEach(() => jest.clearAllMocks());

  test('actualiza la categoría correctamente', async () => {
    const categoriaMock = {
      id: 1,
      nombre: 'Comida',
      update: jest.fn().mockResolvedValue(true)
    };
    Categoria.findByPk.mockResolvedValue(categoriaMock);
    limpiarNombre.mockReturnValue('Alimentación');
    existeNombreDuplicado.mockResolvedValue(false);

    const { req, res } = crearReqRes({ nombre: 'Alimentación' }, { id: '1' });
    await actualizarCategoria(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.message).toBe('Categoría actualizada exitosamente');
    expect(categoriaMock.update).toHaveBeenCalledWith({ nombre: 'Alimentación' });
  });

  test('devuelve 404 si la categoría no existe', async () => {
    Categoria.findByPk.mockResolvedValue(null);

    const { req, res } = crearReqRes({ nombre: 'Comida' }, { id: '999' });
    await actualizarCategoria(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._json.error).toBe('Categoría no encontrada');
  });

  test('devuelve 400 si el nombre está vacío', async () => {
    Categoria.findByPk.mockResolvedValue({ id: 1, nombre: 'Comida' });
    limpiarNombre.mockReturnValue('');

    const { req, res } = crearReqRes({ nombre: '  ' }, { id: '1' });
    await actualizarCategoria(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._json.error).toBe('El nombre es obligatorio');
  });

  test('devuelve 400 si el nombre ya está en uso por otra categoría', async () => {
    Categoria.findByPk.mockResolvedValue({ id: 1, nombre: 'Comida', update: jest.fn() });
    limpiarNombre.mockReturnValue('Transporte');
    existeNombreDuplicado.mockResolvedValue(true);

    const { req, res } = crearReqRes({ nombre: 'Transporte' }, { id: '1' });
    await actualizarCategoria(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._json.error).toBe('Ya existe una categoría con ese nombre');
  });

  test('devuelve 500 si ocurre un error inesperado', async () => {
    Categoria.findByPk.mockRejectedValue(new Error('DB error'));

    const { req, res } = crearReqRes({ nombre: 'Comida' }, { id: '1' });
    await actualizarCategoria(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al actualizar la categoría');
  });
});


describe('CATEGORIAS — eliminarCategoria', () => {
  beforeEach(() => jest.clearAllMocks());

  test('elimina la categoría correctamente', async () => {
    const categoriaMock = {
      id: 1,
      nombre: 'Comida',
      destroy: jest.fn().mockResolvedValue(true)
    };
    Categoria.findByPk.mockResolvedValue(categoriaMock);

    const { req, res } = crearReqRes({}, { id: '1' });
    await eliminarCategoria(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.message).toBe('Categoría eliminada exitosamente');
    expect(categoriaMock.destroy).toHaveBeenCalled();
  });

  test('devuelve 404 si la categoría no existe', async () => {
    Categoria.findByPk.mockResolvedValue(null);

    const { req, res } = crearReqRes({}, { id: '999' });
    await eliminarCategoria(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._json.error).toBe('Categoría no encontrada');
  });

  test('devuelve 500 si ocurre un error inesperado', async () => {
    Categoria.findByPk.mockRejectedValue(new Error('DB error'));

    const { req, res } = crearReqRes({}, { id: '1' });
    await eliminarCategoria(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al eliminar la categoría');
  });
});
