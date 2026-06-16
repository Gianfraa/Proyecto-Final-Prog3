const { Categoria } = require('../dist/models');
const { limpiarNombre, existeNombreDuplicado } = require('../utils/categoriaHelpers');

const crearCategoria = async (req, res) => {
    try {
        const nombreLimpio = limpiarNombre(req.body.nombre);

        if (!nombreLimpio) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }

        if (await existeNombreDuplicado(Categoria, nombreLimpio)) {
            return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
        }

        const categoria = await Categoria.create({ nombre: nombreLimpio });

        res.status(201).json({
            message: 'Categoría creada exitosamente',
            categoria
        });
    } catch (error) {
        console.error('Error en crearCategoria:', error);
        res.status(500).json({ error: 'Error al crear la categoría' });
    }
};

const listarCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.findAll({
            order: [['nombre', 'ASC']]
        });

        res.json({ categorias });
    } catch (error) {
        console.error('Error en listarCategorias:', error);
        res.status(500).json({ error: 'Error al obtener las categorías' });
    }
};

const actualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;

        const categoria = await Categoria.findByPk(id);
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        const nombreLimpio = limpiarNombre(req.body.nombre);
        if (!nombreLimpio) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }

        if (await existeNombreDuplicado(Categoria, nombreLimpio, parseInt(id))) {
            return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
        }

        await categoria.update({ nombre: nombreLimpio });

        res.json({
            message: 'Categoría actualizada exitosamente',
            categoria
        });
    } catch (error) {
        console.error('Error en actualizarCategoria:', error);
        res.status(500).json({ error: 'Error al actualizar la categoría' });
    }
};

const eliminarCategoria = async (req, res) => {
    try {
        const { id } = req.params;

        const categoria = await Categoria.findByPk(id);
        if (!categoria) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        await categoria.destroy();

        res.json({ message: 'Categoría eliminada exitosamente' });
    } catch (error) {
        console.error('Error en eliminarCategoria:', error);
        res.status(500).json({ error: 'Error al eliminar la categoría' });
    }
};

module.exports = { crearCategoria, listarCategorias, actualizarCategoria, eliminarCategoria };