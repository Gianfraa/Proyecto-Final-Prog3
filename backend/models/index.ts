import { Sequelize, ModelStatic } from 'sequelize';

import config from '../config/database';

import initUser from './User';
import initCategoria from './Categoria';
import initTransaccion from './Transaccion';
import initSimulacion from './Simulacion';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

export const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions,
  }
);

export const User = initUser(sequelize);
export const Categoria = initCategoria(sequelize);
export const Transaccion = initTransaccion(sequelize);
export const Simulacion = initSimulacion(sequelize);

type Models = {
  User: typeof User;
  Categoria: typeof Categoria;
  Transaccion: typeof Transaccion;
  Simulacion: typeof Simulacion;
};

const models: Models = {
  User,
  Categoria,
  Transaccion,
  Simulacion,
};

Object.values(models).forEach((model) => {
  const modelWithAssociate = model as ModelStatic<any> & {
    associate?: (models: Models) => void;
  };

  if (typeof modelWithAssociate.associate === 'function') {
    modelWithAssociate.associate(models);
  }
});

export { Sequelize };

export default models;