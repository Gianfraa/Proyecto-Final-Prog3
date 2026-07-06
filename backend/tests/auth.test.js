jest.mock('../dist/models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  }
}));


jest.mock('../middleware/auth', () => ({
  generarToken: jest.fn(() => 'token_falso_123'),
  verificarToken: jest.fn((req, res, next) => next()),
}));



const { register, login, perfil } = require('../controllers/authController');
const { generarToken, verificarToken } = require('../middleware/auth');
const { User } = require('../dist/models');
const jwt = require('jsonwebtoken');


function crearReqRes(body = {}, userPayload = null) {
  const req = {
    body,
    user: userPayload,
    headers: {}
  };
  const res = {
    statusCode: 200,
    _json: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this._json = data;
      return this;
    }
  };
  return { req, res };
}

describe('AUTH — register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('registra un usuario nuevo y devuelve token', async () => {
    User.findOne.mockResolvedValue(null);
    const usuarioCreado = { id: 1, nombre: 'Juan', email: 'juan@test.com' };
    User.create.mockResolvedValue(usuarioCreado);
    const { req, res } = crearReqRes({ nombre: 'Juan', email: 'juan@test.com', password: '123456' });
    await register(req, res);
    expect(res.statusCode).toBe(201);
    expect(res._json.message).toBe('Usuario registrado exitosamente');
    expect(res._json.token).toBe('token_falso_123');
    expect(User.create).toHaveBeenCalledWith({ nombre: 'Juan', email: 'juan@test.com', password: '123456' });
  });

  test('devuelve 400 si el email ya está registrado', async () => {
    User.findOne.mockResolvedValue({ id: 99, email: 'juan@test.com' });
    const { req, res } = crearReqRes({ nombre: 'Juan', email: 'juan@test.com', password: '123456' });
    await register(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._json.error).toBe('El email ya está registrado');
    expect(User.create).not.toHaveBeenCalled();
  });

  test('devuelve 500 si ocurre un error inesperado', async () => {
    User.findOne.mockRejectedValue(new Error('DB caída'));
    const { req, res } = crearReqRes({ nombre: 'Juan', email: 'juan@test.com', password: '123456' });
    await register(req, res);
    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al registrar usuario');
  });
});

describe('AUTH — login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('hace login con credenciales correctas y devuelve token', async () => {
    const usuarioMock = { id: 1, email: 'juan@test.com', validarPassword: jest.fn().mockResolvedValue(true) };
    User.findOne.mockResolvedValue(usuarioMock);
    const { req, res } = crearReqRes({ email: 'juan@test.com', password: '123456' });
    await login(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._json.message).toBe('Login exitoso');
    expect(res._json.token).toBe('token_falso_123');
    expect(usuarioMock.validarPassword).toHaveBeenCalledWith('123456');
  });

  test('devuelve 401 si el usuario no existe', async () => {
    User.findOne.mockResolvedValue(null);
    const { req, res } = crearReqRes({ email: 'noexiste@test.com', password: '123456' });
    await login(req, res);
    expect(res.statusCode).toBe(401);
    expect(res._json.error).toBe('Credenciales inválidas');
  });

  test('devuelve 401 si la password es incorrecta', async () => {
    const usuarioMock = { id: 1, email: 'juan@test.com', validarPassword: jest.fn().mockResolvedValue(false) };
    User.findOne.mockResolvedValue(usuarioMock);
    const { req, res } = crearReqRes({ email: 'juan@test.com', password: 'password_mal' });
    await login(req, res);
    expect(res.statusCode).toBe(401);
    expect(res._json.error).toBe('Credenciales inválidas');
  });

  test('devuelve 500 si ocurre un error inesperado', async () => {
    User.findOne.mockRejectedValue(new Error('DB caída'));
    const { req, res } = crearReqRes({ email: 'juan@test.com', password: '123456' });
    await login(req, res);
    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al iniciar sesión');
  });
});

describe('AUTH — perfil', () => {
  beforeEach(() => jest.clearAllMocks());

  test('devuelve los datos del usuario logueado', async () => {
    const usuarioMock = { id: 1, nombre: 'Juan', email: 'juan@test.com' };
    User.findByPk.mockResolvedValue(usuarioMock);
    const { req, res } = crearReqRes({}, { id: 1 });
    await perfil(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._json.user).toEqual(usuarioMock);
    expect(User.findByPk).toHaveBeenCalledWith(1);
  });

  test('devuelve 404 si el usuario no existe en la BD', async () => {
    User.findByPk.mockResolvedValue(null);
    const { req, res } = crearReqRes({}, { id: 999 });
    await perfil(req, res);
    expect(res.statusCode).toBe(404);
    expect(res._json.error).toBe('Usuario no encontrado');
  });

  test('devuelve 500 si ocurre un error inesperado', async () => {
    User.findByPk.mockRejectedValue(new Error('DB caída'));
    const { req, res } = crearReqRes({}, { id: 1 });
    await perfil(req, res);
    expect(res.statusCode).toBe(500);
    expect(res._json.error).toBe('Error al obtener perfil');
  });
});

describe('MIDDLEWARE — verificarToken (real, sin mock)', () => {
  const JWT_SECRET = 'secret_por_defecto';
  let verificarTokenReal;

  beforeAll(() => {
    jest.resetModules();
    jest.unmock('../middleware/auth');
    verificarTokenReal = require('../middleware/auth').verificarToken;
  });

  function crearReqResMiddleware(authHeader) {
    const req = { headers: { authorization: authHeader } };
    const res = {
      statusCode: 200,
      _json: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this._json = data; return this; }
    };
    const next = jest.fn();
    return { req, res, next };
  }

  test('llama next() con un token válido', () => {
    const token = jwt.sign({ id: 1, email: 'juan@test.com' }, JWT_SECRET, { expiresIn: '1h' });
    const { req, res, next } = crearReqResMiddleware(`Bearer ${token}`);
    verificarTokenReal(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: 1, email: 'juan@test.com' });
  });

  test('devuelve 401 si no hay header Authorization', () => {
    const { req, res, next } = crearReqResMiddleware(undefined);
    verificarTokenReal(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res._json.error).toBe('Token no proporcionado');
    expect(next).not.toHaveBeenCalled();
  });

  test('devuelve 401 si el token es inválido', () => {
    const { req, res, next } = crearReqResMiddleware('Bearer token_inventado_invalido');
    verificarTokenReal(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res._json.error).toBe('Token inválido o expirado');
    expect(next).not.toHaveBeenCalled();
  });

  test('devuelve 401 si falta la parte del token después de Bearer', () => {
    const { req, res, next } = crearReqResMiddleware('Bearer ');
    verificarTokenReal(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});