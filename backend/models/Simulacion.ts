import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { InterfaceSimulacion } from './interfaces/simulacion.interface';
import { User } from './User';

interface SimulacionCreationAttributes extends Optional<InterfaceSimulacion, 'id' | 'createdAt' | 'updatedAt'> {}

export class Simulacion
  extends Model<InterfaceSimulacion, SimulacionCreationAttributes>
  implements InterfaceSimulacion {
    public id!: number;
    public userId!: number;
    public producto!: string
    public precioTotal!: number;
    public cantidadCuotas!: number;
    public tasaInteresMensual!: number;
    public valorCuota!: number;
    public totalFinanciado!: number;
    public activa!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    static associate(models: { User?: typeof User }) {
      if (models.User) {
        Simulacion.belongsTo(
            models.User,
            {
            foreignKey: 'userId'
            }
        );
      }
    }
}

export default function initSimulacion(sequelize: Sequelize): typeof Simulacion {
  Simulacion.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      producto: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notNull: { msg: 'El producto es obligatorio' },
          notEmpty: { msg: 'El producto no puede estar vacío' },
        },
      },
      precioTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          notNull: { msg: 'El precio total es obligatorio' },
          isDecimal: { msg: 'El precio total debe ser un número decimal' },
          min: {
            args: [0],
            msg: 'El precio total debe ser mayor o igual a 0',
          },
        },
      },
      cantidadCuotas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: 'La cantidad de cuotas es obligatoria' },
          isInt: { msg: 'La cantidad de cuotas debe ser un número entero' },
          min: {
            args: [1],
            msg: 'La cantidad de cuotas debe ser al menos 1',
          },
        },
      },
      tasaInteresMensual: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          notNull: { msg: 'La tasa de interés mensual es obligatoria' },
          isDecimal: { msg: 'La tasa de interés mensual debe ser un número decimal' },
          min: {
            args: [0],
            msg: 'La tasa de interés mensual debe ser mayor o igual a 0',
          },
        },
      },
      valorCuota: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          notNull: { msg: 'El valor de la cuota es obligatorio' },
          isDecimal: { msg: 'El valor de la cuota debe ser un número decimal' },
          min: {
            args: [0],
            msg: 'El valor de la cuota debe ser mayor o igual a 0',
          },
        },
      },
      totalFinanciado: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          notNull: { msg: 'El total financiado es obligatorio' },
          isDecimal: { msg: 'El total financiado debe ser un número decimal' },
          min: {
            args: [0],
            msg: 'El total financiado debe ser mayor o igual a 0',
          },
        },
      },
      activa: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'simulaciones',
      timestamps: true,
      underscored: true,
    }
  );

  return Simulacion;
}