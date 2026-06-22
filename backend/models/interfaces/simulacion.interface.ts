export interface InterfaceSimulacion {
    id: number
    userId: number
    producto: string
    precioTotal: number
    cantidadCuotas: number
    tasaInteresMensual: number
    valorCuota: number
    totalFinanciado: number
    activa: boolean
    createdAt?: Date
    updatedAt?: Date
}