const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_por_defecto';

function generarToken(user) {
  // TODO: Generar un token JWT con el id y email del usuario.
  // Pista: usar jwt.sign() con un payload { id, email } y una expiración de '24h'.
}

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  // TODO: Extraer el token del header Authorization.
  // El formato es "Bearer <token>", hay que quedarse solo con la parte del token.
  // Pista: usar split(' ')
  const token = null; // <-- reemplazar esta línea

  if (!token) {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  try {
    // TODO: Verificar y decodificar el token con jwt.verify()
    // Si es válido, guardar los datos del usuario en req.user y llamar a next()
    // Si es inválido, devolver status 401 con un mensaje de error
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { generarToken, verificarToken };
