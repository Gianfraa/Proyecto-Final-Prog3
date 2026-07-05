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