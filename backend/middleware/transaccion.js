function validateTransaccion(req, res, next) {
	const { descripcion, monto, tipo, fecha, categoriaId } = req.body || {};
	const errors = [];

	if (!descripcion || typeof descripcion !== 'string') {
		errors.push({ param: 'descripcion', msg: 'descripcion requerida y debe ser texto' });
	}

	const montoNum = Number(monto);
	if (monto === undefined || Number.isNaN(montoNum) || montoNum <= 0) {
		errors.push({ param: 'monto', msg: 'monto requerido y debe ser número mayor que 0' });
	}

	const tipoStr = typeof tipo === 'string' ? tipo.toLowerCase() : '';
	if (!['ingreso', 'gasto'].includes(tipoStr)) {
		errors.push({ param: 'tipo', msg: 'tipo debe ser "ingreso" o "gasto"' });
	}

	if (fecha !== undefined && Number.isNaN(Date.parse(fecha))) {
		errors.push({ param: 'fecha', msg: 'fecha debe ser una fecha válida' });
	}

	if (categoriaId !== undefined && !Number.isInteger(Number(categoriaId))) {
		errors.push({ param: 'categoriaId', msg: 'categoriaId debe ser un entero' });
	}

	if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
	next();
}

module.exports = { validateTransaccion };
