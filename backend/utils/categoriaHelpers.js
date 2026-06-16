const { Op } = require('sequelize');

function limpiarNombre(nombre) {
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    return null;
    }
    return nombre.trim();
}

async function existeNombreDuplicado(Categoria, nombre, excluirId) {
    const where = { nombre: { [Op.iLike]: nombre } };

    if (excluirId !== undefined) {
    where.id = { [Op.ne]: excluirId };
    }

    const encontrada = await Categoria.findOne({ where });
    return encontrada !== null;
}

module.exports = {
    limpiarNombre,
    existeNombreDuplicado,
};