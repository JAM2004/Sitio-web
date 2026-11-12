# Sitio web — CMS de eventos por plantillas

Sistema web tipo CMS para administrar **eventos** (contenido deportivo/UFC)
mediante **plantillas editables**: una institución crea usuarios con roles
(Administrador, Editor, Visitante), diseña páginas de eventos arrastrando
componentes (texto, imágenes, slider, contacto, about) y las publica por slug.

> Proyecto académico/institucional.

## Stack

- **client**: React 18 + Vite + Chakra UI / MUI (`@dnd-kit` para drag & drop,
  `react-router-dom`, `jwt-decode`, `react-slick`)
- **server**: Node (ESM) + Express 5, `mysql2`, `jsonwebtoken`, `bcryptjs`,
  `multer` (subida de imágenes), `cors`, `dotenv`

## Estructura

```
client/                  # Panel / frontend (React + Vite)
  src/
    pages/               # páginas de la app
    components/          # componentes de UI
    context/             # contexto de auth, etc.
server/                  # API REST (Express)
  src/
    server.js            # entry
    db.js                # conexión MySQL
    hashPass.js
    multerConfig.js
  controllers/  routes/  middleware/
```

Cada parte es un repositorio git propio (`.git/` en `client/` y en `server/`).

## Requisitos

- Node.js + npm
- MySQL 8
- Importar el esquema: `login.sql` (dump de referencia)

Base de datos: usuarios y roles (`usuarios`, `roles`), eventos (`eventos`),
páginas por slug (`paginas`), plantillas con `estructura_base` JSON
(`plantillas`) y sus componentes (`componentes`, `evento_imagenes`).

## Instalación

Server:

```powershell
cd server
npm install
```

Crea el archivo `.env` (clona las variables que espera `src/db.js`):

```
DB_HOST=localhost
DB_USER=root
DB_PASS=tu_pass
DB_NAME=login
JWT_SECRET=tu_secreto_largo
PORTWEB=3000
```

Importa la base con `login.sql` y arranca:

```powershell
npm run dev     # nodemon → http://localhost:3001
```

Client:

```powershell
cd client
npm install
npm run dev     # Vite
```

## API (resumen)

- Usuarios: `POST /usuarios/login`, `GET /usuarios`, `POST /usuarios/registerUsers`,
  `PATCH /usuarios/:id/status`
- Eventos: `POST /eventos/crear`, `GET /eventos/ver`, `PATCH /eventos/editar/:id`,
  `DELETE /eventos/eliminar/:id`
- Plantillas: `GET /plantillas`, `PATCH /plantillas/:id/estructura`, `DELETE /plantillas/:id`

Autenticación por **JWT** (`Authorization: Bearer <token>`) y autorización por roles.

# El proyecto no esta concluido #
