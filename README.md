# Gestión de Gastos Personales

Aplicación web full-stack para registrar y analizar ingresos y gastos personales. Permite categorizar transacciones, distinguir gastos fijos de variables, simular compras en cuotas, ver un balance consolidado con proyección a futuro y obtener reportes mensuales.

---

## Arquitectura General

```
+-------------+    +-------------+    +-------------+
|   Caddy     |    |   React     |    |   Express   |
|  (Proxy)    |<-->| (Frontend)  |<-->|  (Backend)  |
|   :80       |    |   :3000     |    |   :3001     |
+-------------+    +-------------+    +-------------+
                                              |
                   +-------------+    +-------------+
                   |    Redis    |    | PostgreSQL  |
                   |  (Cache)    |    |    (DB)     |
                   |   :6379     |    |   :5432     |
                   +-------------+    +-------------+
```

| Servicio | Tecnología | Puerto | Función |
|----------|------------|--------|---------|
| **Frontend** | React 18 | 3000 | Interfaz de usuario |
| **Backend** | Express + Sequelize | 3001 | API REST |
| **Database** | PostgreSQL 15 | 5432 | Base de datos relacional |
| **Cache** | Redis 7 | 6379 | Caché del dashboard y balance consolidado |
| **Proxy** | Caddy 2 | 80 | Reverse proxy |
| **pgAdmin** | pgAdmin 4 | 5050 | Administración visual de la BD |

---

## Equipo

### Entrega original

| Integrante | Rama | Módulo |
|------------|------|--------|
| **Gianfranco Tarulli** | `alumno4_tarulli` | Arquitectura / DevOps + Dashboard |
| **Nazareno Negrete** | `Negrete_Rama` | Autenticación + Filtros + Historial |
| **Alejo Sanger** | `alumno2_sanger` | Categorías |
| **Nicolas Castellini** | `NCastellini` | Categorías |
| **Julian Peralta** | `alumo3_peralta` | Transacciones |
| **Roman Strizzi** | `alumno5_strizzi` | Transacciones |

### Ampliación — Funciones Financieras (rama `AppV1.1`)

Se agregó un módulo nuevo de análisis financiero (gastos fijos/variables, simulador de compras y balance consolidado). El trabajo se dividió en 5 tracks y se desarrolló en orden secuencial sobre la rama `AppV1.1`:

| Orden | Integrante | Track | Responsabilidad |
|-------|------------|-------|------------------|
| 1 | **Nicolas Castellini** | Persona 1 | Modelo `Transaccion` + campo `naturaleza` (fijo/variable) |
| 2 | **Roman Strizzi** | Persona 2 | Modelo `Simulacion` + CRUD de simulaciones |
| 3 | **Nazareno Negrete** | Persona 3 | Lógica del simulador (cálculo de cuotas) |
| 4 | **Alejo Sanger** | Persona 4 | Balance consolidado (proyección mensual) |
| 5 | **Julian Peralta** | Persona 5 | Caché, validaciones, tests e integración |
| — | **Gianfranco Tarulli** | Documentación | Actualización del README con el nuevo módulo |

---

## Estructura del Proyecto

```
Proyecto-Final-Prog3/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile / Dockerfile.dev
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── nodemon.json
│   ├── copy-config.js            # Copia config/*.js a dist/config/ luego del build
│   ├── server.js
│   ├── config/
│   │   ├── config.js
│   │   ├── database.js
│   │   └── redis.js              # Cliente Redis con TTL y claves de caché
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoriaController.js
│   │   ├── transaccionController.js
│   │   ├── dashboardController.js
│   │   ├── simulacionController.js   # CRUD de simulaciones guardadas
│   │   └── gastosController.js       # Simulador de cuotas + balance consolidado
│   ├── middleware/
│   │   ├── auth.js               # Middleware JWT
│   │   ├── transaccion.js        # Validacion de transacciones
│   │   ├── simulacion.js         # Validacion del simulador de compras
│   │   └── validators.js         # Validaciones con express-validator
│   ├── models/                   # Fuente en TypeScript (.ts)
│   │   ├── index.ts
│   │   ├── User.ts
│   │   ├── Categoria.ts
│   │   ├── Transaccion.ts        # Incluye campo naturaleza (fijo/variable)
│   │   ├── Simulacion.ts
│   │   └── interfaces/
│   ├── dist/                     # Salida compilada de TypeScript (no se versiona)
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── categoriaRoutes.js
│   │   ├── transaccionRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── simulacionRoutes.js   # /api/simulaciones
│   │   └── gastosRoutes.js       # /api/simulador/comprar y /api/balance-consolidado
│   ├── utils/
│   │   ├── categoriaHelpers.ts / .js
│   │   └── simuladorHelpers.js   # calcularCuotas() - amortizacion francesa
│   ├── migrations/
│   ├── seeders/
│   └── tests/
│
├── frontend/
│   ├── Dockerfile / Dockerfile.dev
│   ├── package.json
│   └── src/
│       ├── App.js
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       ├── utils/
│       └── styles/
│
├── database/
│   └── init.sql
│
├── caddy/
│   └── Caddyfile
│
└── pgadmin/
```

> **Nota sobre TypeScript:** los modelos (`models/*.ts`) se escriben en TypeScript y se compilan a JavaScript dentro de `backend/dist/` antes de ejecutarse. La carpeta `dist/` se genera con `npm run build` y no debe subirse al repositorio.

---

## Funciones Financieras del Proyecto

Estas son las cuatro funcionalidades de análisis financiero que se agregaron en la rama `AppV1.1`, y cómo se relacionan entre sí.

### 1. Gastos fijos

Son gastos recurrentes que el usuario paga todos los meses (alquiler, internet, luz, gas, celular, seguros). Permiten calcular cuánto dinero queda realmente disponible después de cubrir las obligaciones mensuales.

> Ejemplo: ingresos $800.000, gastos fijos $350.000 → disponible real $450.000.

En el modelo `Transaccion` esto se representa con el campo `naturaleza`, que puede ser `'fijo'` o `'variable'`.

### 2. Simulador de compras

Permite analizar una compra antes de realizarla. El usuario ingresa el producto, el precio, la cantidad de cuotas y la tasa de interés. La aplicación calcula el costo final, el valor de cada cuota (usando el sistema de amortización francés) y si no se envía tasa de interés, usa un cálculo simple (`precioTotal / cantidadCuotas`).

> Ejemplo: notebook de $1.200.000 en 12 cuotas con 45% de interés → costo final $1.740.000, cuota mensual $145.000.

### 3. Capacidad de endeudamiento

Indica cuánto dinero puede destinarse a cuotas sin comprometer la economía personal, usando como referencia que las cuotas no superen el 30% del ingreso mensual.

> Ejemplo: ingreso mensual de $800.000 → límite recomendado para cuotas $240.000 mensuales.

### 4. Cálculo de ahorro

Se calcula restando los gastos totales a los ingresos registrados, y puede proyectarse a futuro.

> Ejemplo: ingresos $800.000, gastos totales $500.000 → ahorro mensual $300.000 (equivalente a $1.800.000 en seis meses o $3.600.000 en un año).

### Relación entre las funciones

```
Transacciones -> Gastos Fijos -> Disponible Mensual -> Capacidad de Endeudamiento
              -> Simulador de Compras -> Cálculo de Ahorro
```

Estas funcionalidades convierten la aplicación en una herramienta de análisis financiero personal, manteniendo como base la gestión de transacciones, balances e historial ya existente.

---

## Base de Datos

### Tablas

```
users
├── id
├── nombre
├── email
└── password

categorias
├── id
└── nombre

transacciones
├── id
├── descripcion
├── monto
├── tipo          (ingreso | gasto)
├── naturaleza    (fijo | variable)
├── fecha
├── userId        -> users.id
└── categoriaId   -> categorias.id

simulaciones
├── id
├── userId             -> users.id
├── producto
├── precioTotal
├── cantidadCuotas
├── tasaInteresMensual
├── valorCuota
├── totalFinanciado
└── activa
```

### Relaciones

- `User` 1 ——— N `Transacciones`
- `User` 1 ——— N `Simulaciones`
- `Categoria` 1 ——— N `Transacciones`

---

## Endpoints

### Autenticación (`/api/auth`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Registrar usuario | No |
| POST | `/auth/login` | Iniciar sesión | No |
| GET | `/auth/perfil` | Ver perfil | Si |

### Categorías (`/api/categorias`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/categorias` | Crear categoría | Si |
| GET | `/categorias` | Listar categorías | Si |
| PUT | `/categorias/:id` | Editar categoría | Si |
| DELETE | `/categorias/:id` | Eliminar categoría | Si |

### Transacciones (`/api/transacciones`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/transacciones` | Crear transacción (acepta `naturaleza`: fijo/variable) | Si |
| GET | `/transacciones` | Listar transacciones | Si |
| PUT | `/transacciones/:id` | Editar transacción | Si |
| DELETE | `/transacciones/:id` | Eliminar transacción | Si |

### Filtros e Historial (`/api/transacciones`, `/api/historial`)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/transacciones?categoria=1` | Filtrar por categoría | Si |
| GET | `/transacciones?desde=2026-01-01&hasta=2026-01-31` | Filtrar por fecha | Si |
| GET | `/transacciones?tipo=gasto` | Filtrar por tipo | Si |
| GET | `/transacciones?naturaleza=fijo` | Filtrar por naturaleza | Si |
| GET | `/historial` | Historial agrupado por mes | Si |

### Dashboard (`/api`)

| Método | Ruta | Descripción | Auth | Caché |
|--------|------|-------------|------|-------|
| GET | `/balance` | Balance actual | Si | Redis 5min |
| GET | `/resumen` | Resumen mensual | Si | Redis 5min |
| GET | `/estadisticas` | Estadísticas generales | Si | Redis 5min |

### Simulador de compras y balance consolidado (`/api/simulaciones`, `/api`)

| Método | Ruta | Descripción | Auth | Caché |
|--------|------|-------------|------|-------|
| GET | `/simulaciones` | Listar simulaciones guardadas del usuario | Si | — |
| POST | `/simulaciones` | Crear y guardar una simulación de compra | Si | — |
| DELETE | `/simulaciones/:id` | Eliminar una simulación | Si | — |
| POST | `/simulador/comprar` | Simular una compra en cuotas (con opción de guardarla) | Si | — |
| GET | `/balance-consolidado` | Balance actual + ingresos/gastos fijos + simulaciones activas + proyección a 6 meses | Si | Redis 5min |

---

## Cómo Levantar el Proyecto

### Requisitos previos

- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/install/) instalados.

### Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd Proyecto-Final-Prog3

# Crear el archivo de variables de entorno
cp .env.example .env

# Levantar todos los servicios
docker compose up -d --build
```

### Servicios disponibles

| Recurso | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Health check | http://localhost:3001/api/health |
| pgAdmin | http://localhost:5050 |
| App (via Caddy) | http://localhost:80 |

### Detener el proyecto

```bash
# Detener los servicios (mantiene los datos)
docker compose down

# Detener y borrar todos los datos
docker compose down -v
```

---

## Notas de build, dist/ y archivos requeridos

El backend usa TypeScript para los modelos (`models/*.ts`). Antes de ejecutarse, ese código se compila a JavaScript dentro de `backend/dist/`.

- `dist/` se genera con la compilación y **no debe subirse** al repositorio (está en `.gitignore`).
- Si `dist/` no existe o está desactualizada, el servidor puede fallar con `MODULE_NOT_FOUND`.
- `backend/copy-config.js` es un script que copia `config/*.js` a `dist/config/` después de compilar. Se versiona porque es parte del proceso de build.
- `backend/package-lock.json` se versiona para fijar las versiones de dependencias y garantizar instalaciones reproducibles entre los integrantes.
- `backend/utils/categoriaHelpers.ts` es la fuente en TypeScript. Se mantiene además `backend/utils/categoriaHelpers.js` ya compilado en el repo, por compatibilidad temporal con los controllers actuales.

### Comandos recomendados

```bash
# Instalar dependencias (local, sin Docker)
npm install

# Compilar TypeScript a dist/ y ejecutar copy-config.js
npm run build

# Levantar todo con Docker (recomendado para reproducibilidad)
docker compose up -d --build

# Ver logs del backend
docker compose logs backend --tail 50 -f
```

### Pasos rápidos para colaboradores

1. `git pull`
2. `npm install`
3. `docker compose up -d --build` (o `npm run build` + `npm start` si se trabaja sin Docker)

### Problemas comunes

| Error | Causa probable | Solución |
|-------|-----------------|----------|
| `ECONNREFUSED 127.0.0.1:3001` | El backend no está listo o se cayó | `docker compose ps` y `docker compose logs backend --tail 50` |
| `socket hang up` | El backend crasheó al recibir la petición | Revisar logs del backend para ver la excepción |
| `MODULE_NOT_FOUND '../utils/categoriaHelpers'` | Falta el archivo compilado | Verificar que exista `backend/utils/categoriaHelpers.js` o correr `npm run build` |
| `Cannot find module './models'` al correr `node server.js` local | Se intentó correr el backend fuera de Docker sin compilar | Usar `docker compose up --build` o compilar con `npm run build` antes |

---

## Ramas Git

```
main                        <- estructura base del proyecto
└── dev                     <- integracion de features (entrega original)
    ├── alumno4_tarulli     <- Gianfranco Tarulli (Arquitectura + Dashboard)
    ├── Negrete_Rama        <- Nazareno Negrete (Auth + Filtros + Historial)
    ├── alumno2_sanger      <- Alejo Sanger (Categorías)
    ├── NCastellini         <- Nicolas Castellini (Categorías)
    ├── alumo3_peralta      <- Julian Peralta (Transacciones)
    └── alumno5_strizzi     <- Roman Strizzi (Transacciones)

dev
└── AppV1.1                 <- ampliacion: Funciones Financieras
    (commits secuenciales sobre la misma rama, en este orden:)
    1. Nicolas Castellini   <- Modelo Transaccion + naturaleza (fijo/variable)
    2. Roman Strizzi        <- Modelo Simulacion + CRUD
    3. Nazareno Negrete     <- Logica del simulador (calculo de cuotas)
    4. Alejo Sanger         <- Balance consolidado
    5. Julian Peralta       <- Cache, validaciones, tests e integracion
```

### Flujo de trabajo — Entrega original

Se trabajó con una rama por integrante. El flujo fue secuencial: cada integrante tomó `dev` actualizada, creó su propia rama, desarrolló su parte, hizo push y abrió un Pull Request hacia `dev`. Una vez aprobado y mergeado, el siguiente tomó la base actualizada y continuó. Al finalizar el desarrollo completo, se realizó un último Pull Request de `dev` hacia `main` como entrega definitiva.

### Flujo de trabajo — Ampliación Funciones Financieras

Para el módulo de análisis financiero se dividió el trabajo en 5 tracks dependientes entre sí (modelo → simulación → lógica de cuotas → balance consolidado → caché/validaciones/tests), todos sobre una rama compartida `AppV1.1`. Cada integrante tomó la rama actualizada con el trabajo del anterior, agregó su parte y commiteó en el orden definido, ya que cada track depende de los archivos creados por el anterior (por ejemplo, el balance consolidado necesita el modelo `Simulacion` y el campo `naturaleza` ya creados).

Cada integrante tiene al menos un commit en su rama correspondiente y su Pull Request aprobado.

---

## Pruebas con Postman

Para probar la API se puede usar [Postman](https://web.postman.co). Si se usa la versión web, es necesario instalar el [Postman Desktop Agent](https://www.postman.com/downloads/postman-agent/) para poder hacer requests a localhost.

### 1. Registrar usuario

- Método: `POST`
- URL: `http://localhost:3001/api/auth/register`
- Body (raw JSON):

```json
{
    "nombre": "Gian",
    "email": "gian@test.com",
    "password": "123456"
}
```

Respuesta esperada:

```json
{
    "message": "Usuario registrado exitosamente",
    "user": {
        "id": 1,
        "nombre": "Gian",
        "email": "gian@test.com",
        "updatedAt": "2026-06-11T00:47:41.623Z",
        "createdAt": "2026-06-11T00:47:41.623Z"
    },
    "token": "<jwt_token>"
}
```

### 2. Iniciar sesión

- Método: `POST`
- URL: `http://localhost:3001/api/auth/login`
- Body (raw JSON):

```json
{
    "email": "gian@test.com",
    "password": "123456"
}
```

Respuesta esperada:

```json
{
    "message": "Login exitoso",
    "user": {
        "id": 1,
        "nombre": "Gian",
        "email": "gian@test.com"
    },
    "token": "<jwt_token>"
}
```

### 3. Endpoints autenticados

Los endpoints de categorías, transacciones, dashboard y simulador requieren el token JWT obtenido en el login. En Postman se agrega en la pestaña **Headers**:

| Key | Value |
|-----|-------|
| Authorization | Bearer `<jwt_token>` |

Por terminal (bash/git bash), conviene guardar el token en una variable para reutilizarlo:

```bash
TOKEN="<jwt_token>"
curl http://localhost:3001/api/balance -H "Authorization: Bearer $TOKEN"
```

### 4. Categorías

- Método: `POST`
- URL: `http://localhost:3001/api/categorias`
- Body (raw JSON):

```json
{
    "nombre": "Comida"
}
```

Respuesta esperada:

```json
{
    "message": "Categoría creada exitosamente",
    "categoria": {
        "id": 1,
        "nombre": "Comida",
        "updatedAt": "2026-06-16T18:30:48.336Z",
        "createdAt": "2026-06-16T18:30:48.336Z"
    }
}
```

### 5. Transacciones

- Método: `POST`
- URL: `http://localhost:3001/api/transacciones`
- Body (raw JSON):

```json
{
    "descripcion": "Almuerzo",
    "monto": 1500,
    "tipo": "gasto",
    "naturaleza": "variable",
    "fecha": "2026-06-16",
    "categoriaId": 1
}
```

Respuesta esperada:

```json
{
    "data": {
        "id": 1,
        "descripcion": "Almuerzo",
        "monto": "1500.00",
        "tipo": "gasto",
        "naturaleza": "variable",
        "fecha": "2026-06-16T00:00:00.000Z",
        "userId": 1,
        "categoriaId": 1,
        "updatedAt": "2026-06-16T18:33:13.096Z",
        "createdAt": "2026-06-16T18:33:13.096Z"
    }
}
```

### 6. Historial

- Método: `GET`
- URL: `http://localhost:3001/api/historial`

Respuesta esperada:

```json
{
    "historial": [
        {
            "mes": "2026-06",
            "ingresos": 2500,
            "gastos": 0,
            "cantidadIngresos": 1,
            "cantidadGastos": 0,
            "balance": 2500
        }
    ]
}
```

### 7. Balance

- Método: `GET`
- URL: `http://localhost:3001/api/balance`

Respuesta esperada (sin transacciones cargadas):

```json
{
    "balance": 0,
    "totalIngresos": 0,
    "totalGastos": 0,
    "fromCache": false
}
```

Respuesta esperada (con transacciones cargadas):

```json
{
    "balance": 80000,
    "totalIngresos": 150000,
    "totalGastos": 70000,
    "fromCache": false
}
```

> La segunda vez que se llama al mismo endpoint, `fromCache` devuelve `true` porque Redis ya tiene el resultado guardado. Si se cargan transacciones nuevas y la caché todavía no expiró, conviene reiniciar Redis para ver los valores actualizados: `docker compose restart redis`.

### 8. Resumen mensual

- Método: `GET`
- URL: `http://localhost:3001/api/resumen`
- URL con mes especifico: `http://localhost:3001/api/resumen?mes=2026-06`

Respuesta esperada:

```json
{
    "mes": "2026-06",
    "totalIngresos": 150000,
    "totalGastos": 70000,
    "balance": 80000,
    "cantidadTransacciones": 3,
    "gastosPorCategoria": {
        "Sin categoria": 70000
    },
    "fromCache": false
}
```

### 9. Estadísticas

- Método: `GET`
- URL: `http://localhost:3001/api/estadisticas`

Respuesta esperada (sin transacciones cargadas):

```json
{
    "totalTransacciones": 0,
    "totalIngresos": 0,
    "totalGastos": 0,
    "balance": 0,
    "promedioGasto": 0,
    "categoriaTopGasto": null,
    "gastosPorCategoria": {},
    "evolucionMensual": {},
    "fromCache": false
}
```

### 10. Simulador de compras (sin guardar)

- Método: `POST`
- URL: `http://localhost:3001/api/simulador/comprar`
- Body (raw JSON):

```json
{
    "producto": "Notebook",
    "precioTotal": 120000,
    "cantidadCuotas": 6,
    "tasaInteresMensual": 3.5,
    "guardar": true
}
```

Respuesta esperada (sistema de amortización francés):

```json
{
    "data": {
        "id": 1,
        "producto": "Notebook",
        "precioTotal": 120000,
        "cantidadCuotas": 6,
        "tasaInteresMensual": 3.5,
        "valorCuota": 22200.50,
        "totalFinanciado": 133203.00,
        "cuotas": [
            { "mes": 1, "fecha": "2026-07-01", "valorCuota": 22200.50, "interes": 4200.00, "amortizacion": 18000.50, "saldoRestante": 115202.50 },
            { "mes": 2, "fecha": "2026-08-01", "valorCuota": 22200.50, "interes": 4032.09, "amortizacion": 18168.41, "saldoRestante": 97034.09 }
        ],
        "impactoBalanceMensual": -22200.50
    }
}
```

> Si no se envía `tasaInteresMensual` (o se manda 0), el cálculo es simple: `precioTotal / cantidadCuotas`, sin intereses ni tabla de amortización detallada.

### 11. Guardar una simulación

- Método: `POST`
- URL: `http://localhost:3001/api/simulaciones`
- Body (raw JSON):

```json
{
    "producto": "Tablet",
    "precioTotal": 80000,
    "cantidadCuotas": 6,
    "tasaInteresMensual": 2.5
}
```

### 12. Listar simulaciones guardadas

- Método: `GET`
- URL: `http://localhost:3001/api/simulaciones`

Respuesta esperada:

```json
{
    "simulaciones": [
        {
            "id": 1,
            "userId": 1,
            "producto": "Notebook",
            "precioTotal": "120000.00",
            "cantidadCuotas": 6,
            "tasaInteresMensual": "3.50",
            "valorCuota": "22520.19",
            "totalFinanciado": "135121.11",
            "activa": true,
            "createdAt": "2026-06-20T21:53:15.387Z",
            "updatedAt": "2026-06-20T21:53:15.387Z"
        }
    ]
}
```

### 13. Eliminar una simulación

- Método: `DELETE`
- URL: `http://localhost:3001/api/simulaciones/1`

Respuesta esperada:

```json
{ "message": "Simulación eliminada correctamente" }
```

### 14. Balance consolidado

- Método: `GET`
- URL: `http://localhost:3001/api/balance-consolidado`

Devuelve el balance actual junto con una proyección a futuro que tiene en cuenta ingresos y gastos fijos, y las cuotas de simulaciones activas.

Respuesta esperada:

```json
{
    "data": {
        "balanceActual": 80000,
        "ingresosFijosMensuales": 150000,
        "gastosFijosMensuales": 50000,
        "gastosVariablesMesActual": 20000,
        "simulacionesActivas": [],
        "proyeccionMensual": [
            { "mes": "2026-07", "ingresosFijos": 150000, "gastosFijos": 50000, "cuotasSimuladas": 0, "balanceProyectado": 100000 },
            { "mes": "2026-08", "ingresosFijos": 150000, "gastosFijos": 50000, "cuotasSimuladas": 0, "balanceProyectado": 100000 },
            { "mes": "2026-09", "ingresosFijos": 150000, "gastosFijos": 50000, "cuotasSimuladas": 0, "balanceProyectado": 100000 },
            { "mes": "2026-10", "ingresosFijos": 150000, "gastosFijos": 50000, "cuotasSimuladas": 0, "balanceProyectado": 100000 },
            { "mes": "2026-11", "ingresosFijos": 150000, "gastosFijos": 50000, "cuotasSimuladas": 0, "balanceProyectado": 100000 },
            { "mes": "2026-12", "ingresosFijos": 150000, "gastosFijos": 50000, "cuotasSimuladas": 0, "balanceProyectado": 100000 }
        ],
        "balanceNetoProyectado": 600000,
        "fromCache": false
    }
}
```

### 15. Script de prueba automatizado

El proyecto incluye un script de Node.js que recorre los principales endpoints en secuencia (health check, registro, login, transacciones, categorías, balance, simulador y balance consolidado) y muestra el resultado de cada paso por consola. Es útil como humo test rápido después de levantar el proyecto:

```bash
node test-endpoints.js
```

---

## Stack Tecnológico

### Backend
- **[Express](https://expressjs.com/)** — Framework web para Node.js
- **[TypeScript](https://www.typescriptlang.org/)** — Tipado estático para los modelos
- **[Sequelize](https://sequelize.org/)** — ORM para bases de datos SQL
- **[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)** — Generación y verificación de JWT
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** — Hashing de contraseñas
- **[helmet](https://helmetjs.github.io/)** — Headers de seguridad HTTP
- **[cors](https://github.com/expressjs/cors)** — Configuración de Cross-Origin Resource Sharing
- **[morgan](https://github.com/expressjs/morgan)** — Logging de peticiones HTTP
- **[redis](https://github.com/redis/node-redis)** — Cliente Redis para caché
- **[express-validator](https://express-validator.github.io/)** — Validaciones de los endpoints del simulador y de la naturaleza de las transacciones

### Frontend
- **[React 18](https://react.dev/)** — Biblioteca para interfaces de usuario

### Infraestructura
- **[Docker](https://docs.docker.com/)** — Contenedores
- **[Docker Compose](https://docs.docker.com/compose/install/)** — Orquestación multi-contenedor
- **[PostgreSQL 15](https://www.postgresql.org/docs/15/)** — Base de datos relacional
- **[Redis 7](https://redis.io/docs/)** — Caché en memoria
- **[Caddy 2](https://caddyserver.com/docs/)** — Reverse proxy
- **[pgAdmin 4](https://www.pgadmin.org/docs/)** — Administración visual de PostgreSQL