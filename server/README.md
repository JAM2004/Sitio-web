# Sitio Web - API (Servidor)

Resumen breve
- Backend en Node.js (ES modules) para administrar usuarios, eventos, páginas y plantillas de eventos.
- Provee endpoints para autenticación (JWT), gestión de usuarios, creación/edición/eliminación de eventos y gestión de plantillas (estructura JSON).

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
cd "C:\Users\PC-CIT05\Desktop\Sitio web\server"
npm install
-----------------------------------------------

3. Crea la base de datos y las tablas. Puedes usar el archivo `login.sql` (dump) incluido como referencia para crear la estructura inicial.

Variables de entorno (archivo `.env`)
A continuación las variables que el servidor espera (usa `src/server.js` y `src/db.js`):

- `DB_HOST` - host de MySQL (ej. `localhost`)
- `DB_USER` - usuario de BD
- `DB_PASS` - contraseña del usuario de BD
- `DB_NAME` - nombre de la base de datos
- `JWT_SECRET` - secreto para firmar JWT
- `PORTWEB` - puerto donde correr el servidor (opcional, por defecto `3000`)

Ejemplo `.env`:

-------env-----------
DB_HOST=localhost
DB_USER=root
DB_PASS=mi_pass
DB_NAME=login
JWT_SECRET=mi_secreto_largo
PORTWEB=3000
---------------------

Scripts útiles
- `npm run dev` - arranca con `nodemon` (mira `src/server.js`)
- `npm start` - arranca en modo producción: `node src/server.js`

Endpoints principales
(En todos los ejemplos `http://localhost:3001` asume `PORTWEB=3000`)

1) Usuarios
- `POST /usuarios/login` — login
  - Body JSON: `{ "email": "user@example.com", "password": "pass" }`
  - Respuesta: `{ token: "<JWT>", user: { ... } }`

- `GET /usuarios` — listar usuarios (requiere token, ver middleware)

- `POST /usuarios/registerUsers` — registrar usuario (requiere admin según middleware)
  - Body: `{ "nombre": "Juan", "email": "x@x.com", "password": "123456", "rol": "2" }`

- `PATCH /usuarios/:id/status` — cambiar estado de usuario (requiere admin)
  - Body: `{ "status": 0 }` o `{ "status": 1 }`

2) Eventos
- `POST /eventos/crear` — crear evento (token requerido)
  - Body ejemplo: `{ "titulo": "Mi Evento", "descripcion": "...", "fecha_inicio": "2025-12-01", "fecha_fin": "2025-12-02", "lugar": "Auditorio" }`
  - Comportamiento: al crear un evento el servidor duplica la plantilla base (id 1), crea una página usando la plantilla duplicada y luego crea el evento vinculado a esa página. Respuesta incluye `paginaId`, `id_evento` e `id_plantilla`.

- `GET /eventos/ver` — listar eventos (token requerido)
- `PATCH /eventos/editar/:id` — editar evento (token requerido según middleware)
- `DELETE /eventos/eliminar/:id` — eliminar evento (requiere admin)
  - Al eliminar se marca `deleted_at` en `eventos` y `paginas`, y la plantilla vinculada (si existe) se marca `estado = 0`.

3) Plantillas
- `GET /plantillas` — lista plantillas (token requerido). Si el usuario no es admin, solo devuelve plantillas con `estado = 1`.
  - En la respuesta, la columna `estructura_base` (JSON) se devuelve como `estructura` ya parseada.

- `PATCH /plantillas/:id/estructura` — actualizar solamente la estructura JSON de la plantilla (requiere admin)
  - Body: `{ "estructura": { /* objeto JSON nuevo */ } }`

- `DELETE /plantillas/:id` — acción especial (requiere admin):
  - Si la plantilla tiene `estado === 1` → en vez de eliminarla, el endpoint *restaura* su `estructura_base` al valor de la plantilla base (`id_plantilla = 1`).
  - Si la plantilla tiene `estado === 0` → realiza eliminación física: rompe relaciones en `paginas` poniendo `plantillas_id_plantilla = NULL` y borra la fila.


Cómo probar rápidamente con Postman
1. `POST /usuarios/login` con un usuario admin para obtener token.
2. En el resto de peticiones añade header: `Authorization: Bearer <TOKEN>` y `Content-Type: application/json`.
3. Prueba crear evento con `POST /eventos/crear` y luego revisa en la BD que se crearon la plantilla duplicada, la página y el evento.

---
Archivo principal del servidor: `src/server.js` — revisa ese archivo para cambiar el puerto o middleware si es necesario.
