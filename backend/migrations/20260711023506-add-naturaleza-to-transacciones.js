'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('transacciones', 'naturaleza', {
      type: Sequelize.ENUM('fijo', 'variable'),
      allowNull: false,
      defaultValue: 'variable',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('transacciones', 'naturaleza');    
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transacciones_naturaleza";');
  },
};