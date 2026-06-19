import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { InterfaceTransaccion } from './interfaces/transaccion.interface';
import { User } from './User';
import { Categoria } from './Categoria';

interface TransaccionCreationAttributes extends Optional<InterfaceTransaccion, 'id' | 'categoriaId' | 'createdAt' | 'updatedAt'> {}

export class Transaccion
  extends Model<InterfaceTransaccion, TransaccionCreationAttributes>
  implements InterfaceTransaccion
{
  public id!: number;
  public descripcion!: string;
  public monto!: number;
  public tipo!: 'ingreso' | 'gasto';
  public fecha!: Date;
  public userId!: number;
  public categoriaId!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: { User?: typeof User; Categoria?: typeof Categoria }) {
    if (models.User) {
      Transaccion.belongsTo(models.User,
        {
        foreignKey: 'userId',
        as: 'usuario',
        }
      );
    }

    if (models.Categoria) {
      Transaccion.belongsTo(models.Categoria,
        {
        foreignKey: 'categoriaId',
        as: 'categoria',
        }
      );
    }
  }
}

export default function initTransaccion(sequelize: Sequelize): typeof Transaccion {
  Transaccion.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      descripcion: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notNull: { msg: 'La descripción es obligatoria' },
          notEmpty: { msg: 'La descripción no puede estar vacía' },
        },
      },
      monto: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          notNull: { msg: 'El monto es obligatorio' },
        },
      },
      tipo: {
        type: DataTypes.ENUM('ingreso', 'gasto'),
        allowNull: false,
        validate: {
          notNull: { msg: 'El tipo es obligatorio' },
          isIn: {
            args: [['ingreso', 'gasto']],
            msg: 'El tipo debe ser ingreso o gasto',
          },
        },
      },
      fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
      },
      categoriaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'categoria_id',
      },
    },
    {
      sequelize,
      tableName: 'transacciones',
      timestamps: true,
      underscored: true,
    }
  );

  return Transaccion;
}
