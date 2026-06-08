export interface InterfaceTransaccion {
  id: number
  descripcion: string
  monto: number
  tipo: 'ingreso' | 'gasto'
  fecha: Date
  userId: number
  categoriaId?: number | null
  createdAt?: Date
  updatedAt?: Date
}
