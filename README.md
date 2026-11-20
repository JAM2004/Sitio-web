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

Un solo repositorio git, con la raíz en la carpeta del proyecto: `client/` y `server/` viven dentro de él.

## Requisitos

- Node.js + npm
- MySQL 8
- Importar el esquema: `server/login.sql` (dump canónico)

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
PORTWEB=3001
```

Importa la base con `server/login.sql` y arranca:

```powershell
npm run dev     # nodemon → http://localhost:3001
```

Client:

```powershell
cd client
npm install
npm run dev     # Vite → http://localhost:5173
```

El cliente pide siempre rutas relativas (`/api/...`, `/uploads/...`):
`vite.config.js` hace de proxy hacia el 3001 en desarrollo; en producción ese
papel lo hace nginx.

## API (resumen)

- Sesión: `POST /login`, `PATCH /usuarios/cambiar-pass`, `PATCH /usuarios/:id/reset-pass`
- Usuarios (solo admin): `GET /usuarios`, `POST /registerUsers`,
  `PATCH /usuarios/:id/status`
- Eventos: `GET /eventos/ver`, `POST /eventos/crear`, `PATCH /eventos/editar/:id`,
  `PATCH /eventos/toggle/:id` — **no hay endpoint de DELETE**: ocultar es `toggle`
- Plantillas: `GET /plantillas`, `GET /plantillas/vista/:id`,
  `PATCH /plantillas/:id/estructura`, `DELETE /plantillas/:id` (vacía la
  plantilla, solo admin)
- Imágenes: `POST /componentes/:id/imagenes`, `GET /componentes/:id/imagenes`
  (público), `PATCH /componentes/imagenes/:id`, `DELETE /componentes/imagenes/:id`
- Página pública: `GET /pagina/:slug` (sin token)

Autenticación por **JWT** (`Authorization: Bearer <token>`) y autorización por roles.

# El proyecto no esta concluido #
