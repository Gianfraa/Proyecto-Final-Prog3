// backend/config/redis.js
const { createClient } = require('redis');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const redisClient = createClient({
    socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    reconnectStrategy: (retries) => {
        if (retries > 5) {
        console.error('Redis: demasiados intentos de reconexión, se abandona.');
        return new Error('Demasiados intentos de reconexión');
        }
      return Math.min(retries * 100, 3000);
    }
    }
});

redisClient.on('connect', () => {
    console.log('Redis conectado correctamente');
});

redisClient.on('error', (err) => {
    console.error('Error de Redis:', err.message);
});

redisClient.on('reconnecting', () => {
    console.log('Reconectando a Redis...');
});

// Conectar al iniciar
(async () => {
    try {
    await redisClient.connect();
    } catch (err) {
    console.error('No se pudo conectar a Redis:', err.message);
    }
})();

// TTL en segundos para las distintas claves de caché
const CACHE_TTL = {
    BALANCE: 300,
    RESUMEN: 300,
    ESTADISTICAS: 300,
    BALANCE_CONSOLIDADO: 300 // nueva línea (sanger)
};

// Claves de caché por usuario
const CACHE_KEYS = {
    balance: (userId) => `balance:user:${userId}`,
    resumen: (userId) => `resumen:user:${userId}`,
    estadisticas: (userId) => `estadisticas:user:${userId}`,
    balanceConsolidado: (userId) => `balance-consolidado:user:${userId}` // nueva línea (sanger)
};

module.exports = { redisClient, CACHE_TTL, CACHE_KEYS };