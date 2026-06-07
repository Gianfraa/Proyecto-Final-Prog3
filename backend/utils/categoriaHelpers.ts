import { Op } from 'sequelize';

interface CategoriaModel {
  findOne: (options: object) => Promise<any>;
}

export function limpiarNombre(nombre: unknown): string | null {
  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    return null;
  }
  return nombre.trim();
}

export async function existeNombreDuplicado(
  Categoria: CategoriaModel,
  nombre: string,
  excluirId?: number
): Promise<boolean> {
  const where: any = { nombre: { [Op.iLike]: nombre } };

  if (excluirId !== undefined) {
    where.id = { [Op.ne]: excluirId };
  }

  const encontrada = await Categoria.findOne({ where });
  return encontrada !== null;
}