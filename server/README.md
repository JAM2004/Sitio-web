# Sitio Web - API (Servidor)

Resumen breve
- Backend en Node.js (ES modules) para administrar usuarios, eventos, páginas y plantillas de eventos.
- Provee endpoints para autenticación (JWT), gestión de usuarios, creación/edición/activación-desactivación de eventos y gestión de plantillas (estructura JSON).

Requisitos
- Node.js
- MySQL 8
- Permisos para crear/leer/escribir la base de datos usada por la aplicación

Dependencias principales (ya en `package.json`)
- `express` - servidor HTTP
- `mysql2` - conexión a MySQL con promesas
- `dotenv` - carga variables de entorno
- `jsonwebtoken` - JWT para autenticación
- `bcryptjs` - hashing de contraseñas
- `cors` - habilitar CORS
- `nodemon` (dev) - recarga en desarrollo

Instalación
1. Clona o coloca el proyecto en tu equipo.
2. Desde la carpeta `server` instala dependencias:

------------------powershell-------------------
cd server
npm install
-----------------------------------------------

3. Crea la base de datos y las tablas importando `login.sql` (dump canónico de esta carpeta).

Variables de entorno (archivo `.env`)
A continuación las variables que el servidor espera (usa `src/server.js` y `src/db.js`):

- `DB_HOST` - host de MySQL (ej. `localhost`)
- `DB_USER` - usuario de BD
- `DB_PASS` - contraseña del usuario de BD
- `DB_NAME` - nombre de la base de datos
- `JWT_SECRET` - secreto para firmar JWT
- `PORTWEB` - puerto donde correr el servidor (opcional, por defecto `3001`)

Ejemplo `.env`:

-------env-----------
DB_HOST=localhost
DB_USER=root
DB_PASS=mi_pass
DB_NAME=login
JWT_SECRET=mi_secreto_largo
PORTWEB=3001
---------------------

Scripts útiles
- `npm run dev` - arranca con `nodemon` (mira `src/server.js`)
- `npm start` - arranca en modo producción: `node src/server.js`

Endpoints principales
(En todos los ejemplos `http://localhost:3001` asume `PORTWEB=3001`)

1) Usuarios
- `POST /login` (alias: `POST /usuarios/login`) — login
  - Body JSON: `{ "email": "user@example.com", "password": "pass" }`
  - Respuesta: `{ token: "<JWT>", user: { ... } }`; el rol 2 (Visitante)
    recibe 403 (no entra al panel).

- `GET /usuarios` — listar usuarios **sin la contraseña**; solo admin.
- `POST /registerUsers` — registrar usuario; solo admin.
  - Body: `{ "nombre": "Juan", "email": "x@x.com", "password": "123456", "rol": "2" }`
- `PATCH /usuarios/:id/status` — activar/desactivar usuario; solo admin (no
  deja desactivar al último admin). Body: `{ "status": 0 }` o `{ "status": 1 }`.
- `PATCH /usuarios/cambiar-pass` — cambia la propia; cualquier autenticado.
  Body: `{ "password_actual", "password_nueva", "password_confirmar" }`
  (mínimo 8 caracteres; `password_actual` no se pide si el admin marcó cambio
  forzado).
- `PATCH /usuarios/:id/reset-pass` — genera contraseña temporal y marca
  `must_change_pass`; solo admin. Devuelve `{ "temporal": "..." }`.

2) Eventos (roles 1 y 3)
- `GET /eventos/ver` — listar eventos; el admin ve también los desactivados,
  el editor solo los activos.
- `POST /eventos/crear` — crear evento.
  - Body ejemplo: `{ "titulo": "Mi Evento", "descripcion": "...", "fecha_inicio": "2025-12-01", "fecha_fin": "2025-12-02", "lugar": "Auditorio" }`
  - Comportamiento: al crear un evento el servidor duplica la plantilla base (id 1), crea una página usando la plantilla duplicada y luego crea el evento vinculado a esa página. Respuesta incluye `paginaId`, `id_evento` e `id_plantilla`.
- `PATCH /eventos/editar/:id` — editar evento; sobre uno desactivado responde 404.
- `PATCH /eventos/toggle/:id` — activar/desactivar: marca o quita `deleted_at`
  en el evento **y en su página y su plantilla**. Esa es la forma de "borrar":
  **no existe `DELETE` de eventos**.

3) Plantillas
- `GET /plantillas` — token; excluye la plantilla base (id 1) y las
  desactivadas. Devuelve `estructura_base` parseada como `estructura`, más
  `slug_url` y la portada.
- `GET /plantillas/vista/:id` — una plantilla para "Ver plantilla" (trae
  `slug_url` para abrir la vista previa).
- `PATCH /plantillas/:id/estructura` — guardar el editor; roles 1 y 3.
  Body: `{ "estructura": { ... } }`
- `DELETE /plantillas/:id` — solo admin: **vacía** la plantilla (restaura su
  estructura a la base por defecto y borra sus imágenes de portada). No borra
  la fila.

4) Imágenes (multipart, campo `imagen`)
- `POST /componentes/:id/imagenes` — subir; roles 1 y 3 (`tipo`: portada,
  galería, fondo, logo, carousel).
- `GET /componentes/:id/imagenes` — **público** (la página pública lee sus portadas).
- `PATCH /componentes/imagenes/:id` / `DELETE /componentes/imagenes/:id` —
  editar o borrar; roles 1 y 3.

5) Página pública
- `GET /pagina/:slug` — sin token; devuelve evento + página + estructura.


Cómo probar rápidamente con Postman
1. `POST /usuarios/login` con un usuario admin para obtener token.
2. En el resto de peticiones añade header: `Authorization: Bearer <TOKEN>` y `Content-Type: application/json`.
3. Prueba crear evento con `POST /eventos/crear` y luego revisa en la BD que se crearon la plantilla duplicada, la página y el evento.

---
Archivo principal del servidor: `src/server.js` — revisa ese archivo para cambiar el puerto o middleware si es necesario.
