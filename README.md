# Gestión de Gastos Personales

Aplicación web full-stack para registrar y analizar ingresos y gastos personales. Permite categorizar transacciones, visualizar el balance y obtener reportes mensuales.

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

| Servicio     | Tecnología          | Puerto | Función                        |
|--------------|-------------------- |--------|--------------------------------|
| **Frontend** | React 18            | 3000   | Interfaz de usuario            |
| **Backend**  | Express + Sequelize | 3001   | API REST                       |
| **Database** | PostgreSQL 15       | 5432   | Base de datos relacional       |
| **Cache**    | Redis 7             | 6379   | Caché del dashboard            |
| **Proxy**    | Caddy 2             | 80     | Reverse proxy                  |
| **pgAdmin**  | pgAdmin 4           | 5050   | Administración visual de la BD |

---

## Equipo

| Integrante             | Rama               | Módulo                            |
|------------------------|--------------------|-----------------------------------|
| **Gianfranco Tarulli** | `alumno4_tarulli`  | Arquitectura / DevOps + Dashboard |
| **Nazareno Negrete**   | `Negrete_Rama`     | Autenticación + Filtros           |
| **Alejo Sanger**       | `alumno2_sanger`   | Categorías                        |
| **Nicolas Castellini** | `NCastellini`      | Categorías                        |
| **Julian Peralta**     | `alumo3_peralta`   | Transacciones                     |
| **Roman Strizzi**      | `alumno5_strizzi`  | Transacciones                     |

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
│   ├── Dockerfile.dev
│   ├── package.json
│   ├── server.js
│   ├── config/
│   │   ├── config.js
│   │   ├── database.js
│   │   └── redis.js              # Cliente Redis con TTL y claves de caché
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoriaController.js
│   │   ├── transaccionController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   └── auth.js               # Middleware JWT
│   ├── models/
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Categoria.js
│   │   └── Transaccion.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── categoriaRoutes.js
│   │   ├── transaccionRoutes.js
│   │   └── dashboardRoutes.js
│   ├── migrations/
│   ├── seeders/
│   ├── tests/
│   └── utils/
│
├── frontend/
│   ├── Dockerfile.dev
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
├── fecha
├── usuario_id    -> users.id
└── categoria_id  -> categorias.id
```

### Relaciones

- `User`      1 ——— N `Transacciones`
- `Categoria` 1 ——— N `Transacciones`

---

## Endpoints

### Autenticación (`/api/auth`)

| Método | Ruta             | Descripción       | Auth |
|--------|------------------|-------------------|------|
| POST   | `/auth/register` | Registrar usuario | No   |
| POST   | `/auth/login`    | Iniciar sesión    | No   |
| GET    | `/auth/perfil`   | Ver perfil        | Si   |

### Categorías (`/api/categorias`)

| Método | Ruta              | Descripción        | Auth |
|--------|-------------------|--------------------|------|
| POST   | `/categorias`     | Crear categoría    | Si   |
| GET    | `/categorias`     | Listar categorías  | Si   |
| PUT    | `/categorias/:id` | Editar categoría   | Si   |
| DELETE | `/categorias/:id` | Eliminar categoría | Si   |

### Transacciones (`/api/transacciones`)

| Método | Ruta                 | Descripción          | Auth |
|--------|----------------------|----------------------|------|
| POST   | `/transacciones`     | Crear transacción    | Si   |
| GET    | `/transacciones`     | Listar transacciones | Si   |
| PUT    | `/transacciones/:id` | Editar transacción   | Si   |
| DELETE | `/transacciones/:id` | Eliminar transacción | Si   |

### Filtros (`/api/transacciones`)

| Método | Ruta                                               | Descripción           | Auth |
|--------|----------------------------------------------------|-----------------------|------|
| GET    | `/transacciones?categoria=1`                       | Filtrar por categoría | Si   |
| GET    | `/transacciones?desde=2026-01-01&hasta=2026-01-31` | Filtrar por fecha     | Si   |
| GET    | `/transacciones?tipo=gasto`                        | Filtrar por tipo      | Si   |
| GET    | `/historial`                                       | Historial paginado    | Si   |

### Dashboard (`/api`)

| Método | Ruta            | Descripción            | Auth | Caché      |
|--------|-----------------|------------------------|------|------------|
| GET    | `/balance`      | Balance actual         | Si   | Redis 5min |
| GET    | `/resumen`      | Resumen mensual        | Si   | Redis 5min |
| GET    | `/estadisticas` | Estadísticas generales | Si   | Redis 5min |

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
docker compose up --build
```

### Servicios disponibles

| Recurso         | URL                              |
|-----------------|----------------------------------|
| Frontend        | http://localhost:3000            |
| Backend API     | http://localhost:3001/api        |
| Health check    | http://localhost:3001/api/health |
| pgAdmin         | http://localhost:5050            |
| App (via Caddy) | http://localhost:80              |

### Detener el proyecto

```bash
# Detener los servicios (mantiene los datos)
docker compose down

# Detener y borrar todos los datos
docker compose down -v
```

---

## Ramas Git

```
main                        <- estructura base del proyecto
└── dev                     <- integración de features
    ├── alumno4_tarulli     <- Gianfranco Tarulli (Arquitectura + Dashboard)
    ├── Negrete_Rama        <- Nazareno Negrete (Auth + Filtros)
    ├── alumno2_sanger      <- Alejo Sanger (Categorías)
    ├── NCastellini         <- Nicolas Castellini (Categorías)
    ├── alumo3_peralta      <- Julian Peralta (Transacciones)
    └── alumno5_strizzi     <- Roman Strizzi (Transacciones)
```

### Flujo de trabajo

Se trabajó con una rama por integrante. El flujo fue secuencial: cada integrante tomó `dev` actualizada, creó su propia rama, desarrolló su parte, hizo push y abrió un Pull Request hacia `dev`. Una vez aprobado y mergeado, el siguiente tomó la base actualizada y continuó. Al finalizar el desarrollo completo, se realizó un último Pull Request de `dev` hacia `main` como entrega definitiva.

Cada integrante tiene al menos un commit en su propia rama y su correspondiente Pull Request aprobado.

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

Los endpoints de categorías, transacciones y dashboard requieren el token JWT obtenido en el login. En Postman se agrega en la pestaña **Headers**:

| Key           | Value                |
|---------------|----------------------|
| Authorization | Bearer `<jwt_token>` |

### 4. Balance

- Método: `GET`
- URL: `http://localhost:3001/api/balance`

Respuesta esperada:

```json
{
    "balance": 0,
    "totalIngresos": 0,
    "totalGastos": 0,
    "fromCache": false
}
```

> La segunda vez que se llama al mismo endpoint, `fromCache` devuelve `true` porque Redis ya tiene el resultado guardado.

### 5. Resumen mensual

- Método: `GET`
- URL: `http://localhost:3001/api/resumen`
- URL con mes especifico: `http://localhost:3001/api/resumen?mes=2026-06`

Respuesta esperada:

```json
{
    "mes": "2026-06",
    "totalIngresos": 0,
    "totalGastos": 0,
    "balance": 0,
    "cantidadTransacciones": 0,
    "gastosPorCategoria": {},
    "fromCache": false
}
```

### 6. Estadísticas

- Método: `GET`
- URL: `http://localhost:3001/api/estadisticas`

Respuesta esperada:

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

---

## Stack Tecnológico

### Backend
- **[Express](https://expressjs.com/)** — Framework web para Node.js
- **[Sequelize](https://sequelize.org/)** — ORM para bases de datos SQL
- **[jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)** — Generación y verificación de JWT
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** — Hashing de contraseñas
- **[helmet](https://helmetjs.github.io/)** — Headers de seguridad HTTP
- **[cors](https://github.com/expressjs/cors)** — Configuración de Cross-Origin Resource Sharing
- **[morgan](https://github.com/expressjs/morgan)** — Logging de peticiones HTTP
- **[redis](https://github.com/redis/node-redis)** — Cliente Redis para caché

### Frontend
- **[React 18](https://react.dev/)** — Biblioteca para interfaces de usuario

### Infraestructura
- **[Docker](https://docs.docker.com/)** — Contenedores
- **[Docker Compose](https://docs.docker.com/compose/install/)** — Orquestación multi-contenedor
- **[PostgreSQL 15](https://www.postgresql.org/docs/15/)** — Base de datos relacional
- **[Redis 7](https://redis.io/docs/)** — Caché en memoria
- **[Caddy 2](https://caddyserver.com/docs/)** — Reverse proxy
- **[pgAdmin 4](https://www.pgadmin.org/docs/)** — Administración visual de PostgreSQL