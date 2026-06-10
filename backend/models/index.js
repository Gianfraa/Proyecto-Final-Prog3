require('ts-node').register({ transpileOnly: true });

const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions
  }
);

const UserModel     = require('./User');
const initCategoria = require('./Categoria').default;
const initTransaccion = require('./Transaccion').default;

const User = UserModel(sequelize);
const Categoria = initCategoria(sequelize);
const Transaccion = initTransaccion(sequelize);

const models = { User, Categoria, Transaccion };

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  Sequelize,
  ...models,
};