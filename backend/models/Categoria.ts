import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { InterfaceCategoria } from './interfaces/categoria.interface';
import { Transaccion } from './Transaccion';

interface CategoriaCreationAttributes extends Optional<InterfaceCategoria, 'id'> {}

export class Categoria
  extends Model<InterfaceCategoria, CategoriaCreationAttributes>
  implements InterfaceCategoria
{
  public id!: number;
  public nombre!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static associate(models: { Categoria?: typeof Categoria; Transaccion?: typeof Transaccion;}) {
    if (models.Transaccion) {
      Categoria.hasMany(models.Transaccion, {
        foreignKey: 'categoria_id',
        as: 'transacciones',
      });
    }
  }
}

export default function initCategoria(sequelize: Sequelize): typeof Categoria {
  Categoria.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notNull: { msg: 'El nombre es obligatorio' },
          notEmpty: { msg: 'El nombre no puede estar vacío' },
          len: {
            args: [1, 100],
            msg: 'El nombre debe tener entre 1 y 100 caracteres',
          },
        },
      },
    },
    {
      sequelize,
      tableName: 'categorias',
      timestamps: true,
    }
  );

  return Categoria;
}