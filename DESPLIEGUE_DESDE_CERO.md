# El despliegue de CIE Conecta, explicado desde cero

Esta guía asume que **no sabés qué es un servidor, Docker o nginx**. Explica qué
se hizo para publicar CIE Conecta en internet, paso a paso, y el *por qué* de
cada cosa. Los comandos exactos están en `DEPLOY.md` (documento local, no
incluido en el repo); este
documento es el manual de conceptos que falta atrás de esa guía.

**Al terminar de leerlo vas a poder explicar:** qué es desplegar, qué hace
Docker, por qué hay tres "contenedores", qué es nginx y el proxy, cómo llega
la gente hasta tu IP, y por qué los backups importan.

---

## Índice

1. [¿Qué significa desplegar?](#1--qué-significa-desplegar)
2. [La nube: alquilar una computadora](#2--la-nube-alquilar-una-computadora)
3. [Docker: empaquetar la app para que corra igual en todos lados](#3--docker-empaquetar-la-app-para-que-corra-igual-en-todos-lados)
4. [La arquitectura: qué hace cada contenedor](#4--la-arquitectura-qué-hace-cada-contenedor)
5. [El paso a paso real (G1-G6)](#5--el-paso-a-paso-real-g1-g6)
6. [DNS y nip.io: cómo llega la gente hasta tu IP](#6--dns-y-nipio-cómo-llega-la-gente-hasta-tu-ip)
7. [CI/CD: que GitHub despliegue solo](#7--cicd-que-github-despliegue-solo)
8. [Backups: cron, mysqldump y por qué](#8--backups-cron-mysqldump-y-por-qué)
9. [Las dos fallas reales que encontramos](#9--las-dos-fallas-reales-que-encontramos)
10. [Glosario](#10--glosario)
11. [Por dónde seguir aprendiendo](#11--por-dónde-seguir-aprendiendo)

---

## 1. ¿Qué significa desplegar?

Mientras desarrollás, la app corre en **tu computadora**: `npm run dev` abre
algo como `http://localhost:5173` y solo vos lo ves, solo mientras tu
computadora está encendida y con el terminal abierto.

**Desplegar (deploy) = poner la app en otra computadora que está siempre
encendida, conectada a internet y a la cual cualquiera puede acceder.** Esa
computadora se llama **servidor**.

Analogía: desarrollar es cocinar en tu casa; desplegar es alquilar un local en
la calle y dejar el negocio abierto para que entre cualquiera.

Tres cosas cambian al desplegar:

| En tu máquina | En el servidor |
|---|---|
| `npm run dev` con recarga automática | la app construida en modo producción (`vite build`, sin recarga) |
| tu MySQL local con datos de prueba | MySQL del servidor con la BD real |
| `localhost` | una **IP pública** que cualquiera puede alcanzar |

---

## 2. La nube: alquilar una computadora

**La nube** no es magia: son centros de datos enormes de empresas (AWS, Google,
Microsoft) donde **alquilás una computadora por la hora** en lugar de comprarla.

Lo que usamos de AWS (Amazon Web Services):

### 2.1 Región

Cada datacenter tiene un nombre de región. Usamos **`us-east-2`** (Ohio, EE.UU.).
Regla: todos los recursos en la misma región, para que hablen entre sí barato
y rápido.

### 2.2 Instancia (EC2)

**EC2** es el servicio de "computadoras alquiladas". Una **instancia** es una
máquina virtual con su sistema operativo. La que levantamos:

- **Tipo `t4g.small`**: 2 núcleos ARM y **2 GB de RAM** — la más barata que
  aguanta el stack completo. (La `t` = económica, la `g` = procesador ARM como
  los Mac modernos, `small` = tamaño.)
- **AMI** (`ami-09c4af6de8b9844f6`): la "foto" del sistema operativo que arranca
  la instancia. Elegimos **Ubuntu 24.04 LTS**, el Linux estándar en servidores.
- **ID `i-078f51cadbf35ca9d`**: la dirección interna de nuestra instancia.

### 2.3 IP pública y Elastic IP

Para que la gente llegue a la instancia necesita un **número de IP** (como una
dirección postal). Al parar y arrancar una instancia, AWS **cambia su IP** a
veces... y eso rompería enlaces y configuraciones.

**Elastic IP** = una IP que *guardás* para siempre aunque la instancia pare.
Nuestra IP fija: **`13.185.75.129`**. (Costa plata si no la usás, pero la
usamos.)

### 2.4 Security Group: el cortafuegos

Un **Security Group** es un conjunto de reglas de qué puertos están abiertos y
desde dónde. Es como el timbre y la reja del local:

| Puerto | Para qué | Quién puede entrar |
|---|---|---|
| **22** | SSH (entrada remota) | **solo tu IP** `177.230.104.161/32` |
| **80** | HTTP (la página) | cualquiera |
| **443** | HTTPS (futuro) | cualquiera |

El puerto 22 restringido a tu IP es seguridad básica: nadie más del mundo puede
ni intentar entrar por SSH.

### 2.5 Key pair y SSH: cómo te conectás

**SSH** = una terminal cifrada que corre en *tu* computadora pero ejecuta
comandos *en el servidor*.

La autenticación no usa contraseña (es más débil), usa **par de llaves**:

- **Llave pública** → se queda dentro de la instancia (la pone AWS al crearla).
- **Llave privada** → `C:\Users\fusio\.ssh\cie-conecta.pem`, **solo en tu
  máquina**. Es tu identidad: quien tenga ese archivo entra.

Por eso el archivo tiene permisos restrictivos (`icacls` en Windows): si cualquier
usuario de tu PC pudiera leerlo, cualquiera podría entrar al servidor.

```powershell
ssh -i C:\Users\fusio\.ssh\cie-conecta.pem ubuntu@13.185.75.129
#                      tu llave privada ─┘   usuario ─┘  servidor ─┘
```

### 2.6 Costos (leé esto)

AWS nos dio **USD 100 de crédito por 6 meses** (Free plan). Nuestro costo
estimado: **~USD 18/mes ≈ 108 USD en 6 meses** — o sea, **se puede pasarse del
crédito**. Antes de que venza:

1. Configurar un **spend limit** (tope de gasto) en *AWS Settings → Billing*.
2. Tener listo el **plan B**: migrar la misma app a Hetzner (~5 EUR/mes, se paga
   de verdad y no depende de créditos). Los pasos están en `DEPLOY.md §G9`.

---

## 3. Docker: empaquetar la app para que corra igual en todos lados

### 3.1 El problema clásico

Para correr CIE Conecta necesitás: Node 22, MySQL 8 con un dump importado,
nginx con un archivo de configuración exacto, las dependencias de `package.json`
instaladas... "En mi máquina funciona, pero en el servidor no" es la frase más
famosa del desarrollo.

**Docker resuelve eso con dos conceptos:**

### 3.2 Imagen y contenedor

- **Imagen** = una plantilla *congelada* con todo adentro: el SO, el código, las
  dependencias, la configuración. Como una foto de un disco rígido.
- **Contenedor** = una **copia corriendo** de esa imagen. Se arranca, se para,
  se borra... y la imagen queda intacta para crear otra vez la misma copia.

La receta para crear la imagen es un archivo **`Dockerfile`**. Ejemplo, el del
servidor (`server/Dockerfile`), traducido:

```dockerfile
FROM node:22-alpine          # empezar desde Node 22 (Alpine = Linux minimal)
WORKDIR /app
COPY package*.json ./
RUN npm ci --install-links   # instalar dependencias
COPY . .                     # copiar el código
CMD ["node", "src/server.js"]# qué ejecutar al arrancar
```

Y el del cliente (`client/Dockerfile`) es **multi-stage**: primero *construye*
la SPA con Vite y luego copia solo los archivos finales a una imagen de nginx.
Resultado: la imagen de producción no trae Node ni el código fuente, solo HTML/
CSS/JS estático — más liviana y más segura.

### 3.3 Volúmenes: la persistencia

Los contenedores son **efímeros**: si los borrás, se va todo lo que tenían
adentro... **salvo los volúmenes**.

Un **volume** es una carpeta del disco del servidor que se *monta* dentro del
contenedor. La data que vive ahí **sobrevive** a borrar y recrear contenedores.

En nuestro `docker-compose.yml` hay dos:

- `cie-conecta_db-data` → los archivos de MySQL (la base de datos entera).
- `cie-conecta_uploads` → las imágenes que suben los usuarios.

Esto es exactamente lo que verificaron las pruebas **N4 y N5**: hicimos
`docker compose down` (borró los tres contenedores) y luego `up`... y el evento,
la imagen y sus archivos seguían ahí. **Eso es gracias a los volúmenes.**

### 3.4 Docker Compose: la orquesta en un archivo

Una app real son varias piezas (app + base de datos + servidor web). Gestionarlas
una por una es engorroso. **`docker-compose.yml`** describe el equipo completo
de una vez:

```yaml
services:
  db:      # MySQL 8 + healthcheck (¿está listo para recibir conexiones?)
  app:     # Node/Express — espera a que db esté "healthy" antes de arrancar
  web:     # nginx — el único con puerto expuesto (80)
volumes:
  - cie-conecta_db-data
  - cie-conecta_uploads
```

Y con un comando se levanta todo:

```bash
docker compose up -d --build
#  -d       "detached": en segundo plano, no bloquea la terminal
#  --build  reconstruye las imágenes con el código actual
```

Dos detalles importantes del archivo:

- **`name: cie-conecta`**: nombra el proyecto y por eso los volúmenes se llaman
  `cie-conecta_uploads`... Si lo cambiás, se rompen los volúmenes y el cron de
  backups (los nombraba a esos).
- **healthcheck**: la app no puede arrancar antes de que MySQL acepte
  conexiones; sin eso, Node intenta conectarse, falla y se muere en un loop.

---

## 4. La arquitectura: qué hace cada contenedor

```
                Internet
                   │
         ┌─────────▼─────────┐
         │  navegador (tú)   │
         └─────────┬─────────┘
                   │  http://13.185.75.129.nip.io
         ┌─────────▼─────────────────────────────┐
         │  contenedor "web"  (nginx, puerto 80) │
         │                                       │
         │  /            → sirve la SPA (HTML)   │
         │  /assets/*    → CSS/JS con caché      │
         │  /api/*       → proxy hacia app:3001  │
         │  /uploads/*   → proxy hacia app:3001  │
         └─────────┬─────────────────────────────┘
                   │  red interna de Docker (solo ellos se ven)
         ┌─────────▼─────────────────────────────┐
         │  contenedor "app"  (Node + Express)   │
         │  la API: login, eventos, plantillas…  │
         └─────────┬─────────────────────────────┘
                   │
         ┌─────────▼─────────────────────────────┐
         │  contenedor "db"  (MySQL 8)           │
         │  la base de datos (volumen persistente)│
         └───────────────────────────────────────┘
```

### Por qué tres contenedores y no uno

Separar significa: cada pieza con su propio proceso, su propio ciclo de vida
(actualizo el front sin tocar la BD), y la base de datos **nunca queda expuesta
a internet** — solo la app dentro de la red interna puede hablar con ella.

### nginx y el proxy inverso

**nginx** es un servidor web ultrarrápido. En nuestro stack hace dos trabajos:

1. **Sirve archivos estáticos**: la SPA ya fue *compilada* por Vite en
   `client/dist` (HTML/CSS/JS con hash en el nombre); nginx los entrega tal cual,
   muy rápido, sin procesar nada.
2. **Proxy inverso**: cuando llega `/api/login`, se lo *reenvía* a
   `http://app:3001/login` dentro de la red interna. El navegador solo habla con
   nginx; nginx decide a quién de adentro se lo pasa.

```
Navegador ──POST /api/login──▶ nginx ──POST /login──▶ Express:3001
              (público)          │                      (interno)
                                └ quita el prefijo /api (barra final del proxy_pass)
```

Por qué el prefijo `/api`: el cliente lo usa para distinguir "esto es API, no
es una página"; nginx lo quita al reenviar porque Express monta las rutas sin
prefijo (`app.use('/login', ...)`). Es el mismo truco que hacía el proxy de
Vite en desarrollo — por eso el código del cliente **no cambió** al desplegar.

**Solo el puerto 80 está abierto al mundo.** Ni MySQL (3306) ni Node (3001)
tienen puertos públicos: desde internet es imposible tocarlos directamente.

---

## 5. El paso a paso real (G1-G6)

Esto es lo que se ejecutó, en orden, y qué hizo cada cosa.

### G1 — Levantar la máquina

```bash
aws ec2 run-instances --image-id ami-09c4af6de8b9844f6 \
  --instance-type t4g.small --key-name cie-conecta \
  --security-group-ids sg-05da7598883f5add7 ...
aws ec2 wait instance-status-ok ...   # esperar chequeos de hardware
aws ec2 allocate-address ...          # la Elastic IP
aws ec2 associate-address ...         # pegarla a la instancia
```

Creó la máquina (Ubuntu 24.04 ARM), esperó a que AWS confirme que el hardware
está bien (`status checks`), y le asignó la IP fija `13.185.75.129`.

### G2 — Preparar el servidor

```bash
curl -fsSL https://get.docker.com | sh   # instalar Docker (el script oficial)
sudo usermod -aG docker ubuntu           # dar permisos de docker a ubuntu
sudo fallocate -l 2G /swapfile ...       # crear 2 GB de swap
```

- `curl ... | sh` = descargar el *script oficial* de Docker y ejecutarlo. Es la
  forma recomendada por Docker para instalación única (para producción con
  paquetes gestionados, vería la doc de tu distro).
- **Swap**: la instancia tiene solo 2 GB de RAM. El swap es una parte del disco
  que el kernel usa como **RAM de emergencia**. Sin él, el `vite build` podía
  morir por quedarse sin memoria (OOM). `free -h` muestra el swap activo.

### G3 — Poner la app a correr

```bash
git clone https://github.com/JAM2004/Sitio-web.git
cd Sitio-web
cp .env.example .env
# generar secretos EN el servidor (nunca se imprimen ni se suben a git):
DBPASS=$(openssl rand -hex 24)   # contraseña de MySQL
JWT=$(openssl rand -hex 24)      # secreto para firmar tokens
docker compose up -d --build
```

El archivo `.env` lleva los secretos y **está en `.gitignore`**: no se commitea
nunca. Por eso existe `.env.example` (las claves sin valores) como plantilla.

`--build` construyó las imágenes: `npm ci` + `vite build` del cliente dentro
de la imagen (tardó ~8 s con caché) y la imagen de Node para el server. Después,
el healthcheck de MySQL importó el dump `login.sql` automáticamente (es el
`.sql` que entra a `/docker-entrypoint-initdb.d/` de la imagen oficial).

Resultado: los 3 contenedores arriba, `db` healthy, login devolviendo token.

### G4 — nip.io (ver §6)

### G5 — Secretos de GitHub Actions (pendiente, ver §7)

### G6 — Backups automáticos (ver §8)

---

## 6. DNS y nip.io: cómo llega la gente hasta tu IP

Las computadoras se encuentran por **IP** (`13.185.75.129`), pero la gente
recuerda **nombres**. El **DNS** es la agenda que traduce nombre → IP
(como la guía telefónica de internet).

Normalmente comprás un dominio (`miequipo.com`) en un registrador y configurás
registros A apuntando a tu IP. **nip.io** es un servicio gratuito que hace eso
*automáticamente*: **cualquier nombre de la forma `<IP>.nip.io` resuelve a esa
IP**. Es decir:

```
13.185.75.129.nip.io   →   13.185.75.129
```

Sin configurar nada, sin comprar nada. Nuestra app vive en:

```
http://13.185.75.129.nip.io
```

**Falta el HTTPS** (el candado 🔒). Hoy todo va por HTTP (puerto 80). Para
HTTPS hay que terminar el TLS con un certificado: la guía contempla que lo haga
Cloudflare frente a la instancia si más adelante comprás un dominio real
(`DEPLOY.md §G4`). nip.io solo da HTTP.

---

## 7. CI/CD: que GitHub despliegue solo

**CI/CD** = *integración continua / despliegue continuo*: en vez de desplegar a
mano (SSH, copiar, reiniciar), **cada push al repo dispara el despliegue
automáticamente**.

Nuestro workflow: `.github/workflows/deploy.yml`, dos trabajos:

1. **lint**: instala dependencias y corre ESLint en cliente y server. Si hay
   errores, **ahí se corta** y no se despliega nada (nadie sube código roto).
2. **deploy**: si el lint pasó, se conecta por SSH a la instancia y ejecuta:
   ```bash
   git pull --ff-only                       # traer el último commit
   docker compose up -d --build --force-recreate web
   ```
   (`--force-recreate web` es obligatorio: nginx cachea la IP interna del
   contenedor `app`; sin recrearlo, responde 502 después de actualizar el API.)

**Secrets**: la IP, el usuario y la llave privada necesarios para el SSH van en
*Settings → Secrets and variables → Actions* de GitHub, como variables
**cifradas** — el workflow las ve, pero nunca quedan en el historial ni en el
repo. Este es el paso **G5, todavía pendiente**:

| Secret | Valor |
|---|---|
| `EC2_HOST` | `13.185.75.129` |
| `EC2_USER` | `ubuntu` |
| `EC2_KEY` | el contenido completo de `C:\Users\fusio\.ssh\cie-conecta.pem` |

El workflow tiene un guard (`if: secrets.EC2_HOST != ''`): si los secretos no
existen, simplemente no intenta desplegar (por eso los pushes antiguos no
fallaron).

---

## 8. Backups: cron, mysqldump y por qué

Un backup es una **copia de seguridad** de los datos por si: se rompe el disco,
alguien borra algo por error, un deploy sale mal, o el ransomware ataca.
La regla: **si no está probado, no existe.**

**`cron`** es el programador de tareas de Linux: decís "ejecutá esto cada día a
las 3:00" y lo hace solo. La sintaxis de cada línea es:

```
minuto hora día-de-mes mes día-de-semana  comando
0      3    *          *   *              ← todos los días a las 03:00
```

Nuestro crontab (instalado en el servidor) tiene 3 líneas:

```cron
# backup de MySQL a las 03:00
0 3 * * * docker exec $(docker ps -qf ancestor=mysql:8.0) \
  sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" login' \
  | gzip > /home/ubuntu/backups/login-$(date +\%F).sql.gz

# backup de las imágenes subidas a las 03:30
30 3 * * * docker run --rm -v cie-conecta_uploads:/u:ro \
  -v /home/ubuntu/backups:/b alpine tar czf /b/uploads-$(date +\%F).tar.gz -C /u .

# borrar copias de más de 30 días a las 04:00
0 4 * * * find /home/ubuntu/backups -name '*.gz' -mtime +30 -delete
```

Desglose:

- **`mysqldump`** = exporta la BD como archivo `.sql` (todas las tablas en
  texto). La password sale de la variable de entorno del contenedor MySQL.
- **`docker exec`** = "ejecutá este comando *dentro* del contenedor MySQL".
- **`tar` + `gzip`** = empaquetar y comprimir la carpeta de imágenes.
- **`$(date +%F)`** = pone la fecha en el nombre para no pisar copias viejas.
  (En crontab el `%` se escapa como `\%` — es especial para cron.)
- **`-mtime +30 -delete`** = purga automática para que el disco no se llene.

Las dos copias se **probaron de verdad**: `gzip -t` verifica que el dump esté
íntegro y el tar se generó con las imágenes adentro. Un backup sin probar es
un archivo que no sabés si sirve.

---

## 9. Las dos fallas reales que encontramos

Los bugs enseñan más que lo que sale bien. Estos dos pasaron en el despliegue
real:

### Falla 1 — Todo el sitio devolvía 500

**Síntoma:** `curl http://localhost/` → `HTTP 500 Internal Server Error`.

**Causa:** al reescribir `nginx.conf` para el contenedor, faltó una línea:
`root /usr/share/nginx/html;`. Sin ella, nginx buscaba los archivos en
`/etc/nginx/html` (carpeta inexistente). El `try_files` de la SPA —que sirve
`index.html` como respaldo para cualquier ruta— no encontraba nada, caía en el
mismo bucle otra vez, y nginx aborta con **ciclo de redirección interna → 500**.

**Arreglo:** una línea (`root`), commit `5022e97`.

**Lección:** los *defaults* no siempre son lo que asumís, y un 500 en nginx casi
siempre es configuración, no código. Para diagnosticar:
`docker logs cie-conecta-web-1` muestra el error exacto de nginx.

### Falla 2 — El cron quedó vacío sin aviso

**Síntoma:** el script de backups terminó `exit 0`, todo "OK"... pero
`crontab -l` no mostraba **ninguna** línea.

**Causa:** el script tenía `set -e` (morir ante cualquier error) y construía el
crontab así: `(crontab -l; cat archivo) | crontab -`. Como no había crontab
previo, el primer `crontab -l` **fallaba** y `set -e` mataba el subshell antes
de que `cat` pasara el contenido: **a `crontab -` llegó una entrada vacía**, que
instala un crontab vacío sin error. El `exit 0` era cierto... y engañoso.

**Arreglo:** escribir el crontab a un archivo e instalarlo con
`crontab /tmp/cie-backups.cron` (sin subshell), y verificar con `crontab -l`
que las 3 líneas estén.

**Lección:** verificar **el efecto**, no solo el código de salida. Y desconfiar
de `set -e` dentro de subshells/pipelines.

### Bonus — comandos que fallan por sintaxis

También pasó: `run-instances` con `--min-count/--max-count` (parámetros que no
existen en esa versión del CLI; era `--count 1`), y el eterno problema de
PowerShell comiéndose las comillas al pasar JSON a la CLI nativa de AWS (solución:
pasar los JSON por archivo `file://`). **Lección:** leer el error completo antes
de reintentar; casi siempre dice exactamente qué falló.

---

## 10. Glosario

| Término | Significado en una línea |
|---|---|
| **Desplegar (deploy)** | Poner la app en un servidor siempre encendido y accesible por internet. |
| **Servidor** | Computadora alquilada que aloja la app. |
| **Región** | Ubicación geográfica del datacenter (nuestra: `us-east-2`, Ohio). |
| **Instancia (EC2)** | Una máquina virtual alquilada en AWS. |
| **AMI** | La "foto" del sistema operativo con la que arranca la instancia. |
| **Elastic IP** | IP fija que no cambia al parar la instancia. |
| **Puerto** | Número que identifica un servicio dentro de una IP (80=web, 22=SSH, 3306=MySQL). |
| **Security Group** | Cortafuegos: qué puertos abiertos y desde dónde. |
| **SSH** | Terminal remota cifrada para ejecutar comandos en el servidor. |
| **Key pair / .pem** | Par de llaves de acceso SSH; la privada es tu identidad. |
| **Docker** | Tecnología para empaquetar apps con todo lo que necesitan adentro. |
| **Imagen** | Plantilla congelada con SO + código + dependencias. |
| **Contenedor** | Copia corriendo de una imagen. |
| **Dockerfile** | Receta para construir una imagen. |
| **Volumen** | Carpeta de disco persistente que sobrevive a borrar contenedores. |
| **Docker Compose** | Archivo YAML que describe y levanta todo el equipo de contenedores. |
| **Healthcheck** | Prueba periódica de "¿este servicio está listo?"; condiciona arranques. |
| **nginx** | Servidor web: sirve estáticos y hace de proxy hacia el API. |
| **Proxy inverso** | Recibe peticiones públicas y las reenvía a servicios internos. |
| **SPA** | Single Page App: la de React, un solo HTML que navega en JS. |
| **Vite** | Herramienta que compila/bundlea la SPA a archivos estáticos. |
| **DNS** | Traduce nombres (`nip.io`) a IPs. |
| **nip.io** | DNS gratuito que resuelve `<IP>.nip.io` a esa IP. |
| **HTTPS/TLS** | Tráfico cifrado con candado; falta configurarlo (Cloudflare). |
| **CI/CD** | Automatizar lint + tests + despliegue en cada push. |
| **GitHub Actions** | El servicio de CI/CD de GitHub. |
| **Secret** | Variable cifrada en Actions (IP, llave SSH). |
| **cron** | Programador de tareas de Linux ("ejecutá esto cada día a las 3"). |
| **mysqldump** | Exporta la BD a un archivo `.sql`. |
| **swap** | Disco usado como RAM de emergencia. |
| **JWT** | Token firmado que mantiene la sesión del login. |
| **.env** | Archivo local con secretos; nunca se commitea. |

---

## 11. Por dónde seguir aprendiendo

### Ejercicios prácticos con *nuestro* servidor (el mejor aprendizaje)

```bash
ssh -i C:\Users\fusio\.ssh\cie-conecta.pem ubuntu@13.185.75.129
cd Sitio-web

docker compose stop web      # ¿qué pasa con la página?
docker compose stop app      # ¿qué pasa con /api?
docker compose logs app --tail 30   # leer los logs = la mitad del debugging
docker stats                 # RAM/CPU de los 3 contenedores en vivo
free -h                      # ver el swap en acción
docker compose start web && docker compose start app
```

Romper y arreglar explica el `docker-compose.yml` mejor que cualquier lectura.

### Repetir el despliegue desde cero

Borrás la instancia desde la consola y seguís `DEPLOY.md` G1→G3 **sin mirar el
historial de chat**. Donde te atores es donde realmente no lo entendiste.

### Un recurso por tema (nada de cursos largos)

| Tema | Recurso | Tiempo |
|---|---|---|
| Docker | Tutorial oficial *Get Started* (docs.docker.com) | ~1 h |
| nginx | *Beginner's Guide* (nginx.org/en/docs/beginners_guide.html) | ~2 h |
| Linux/bash | linuxjourney.com | libre |
| AWS | AWS Skill Builder → ruta *Cloud Practitioner* | libre |
| HTTP/HTTPS | MDN → *HTTP* y *TLS* | ~1 h |

### El mapa mental

Cada paso del despliegue es un concepto estándar de la industria — nada de esto
es especial de este proyecto:

`run-instances/SG/EIP` → computación en la nube · `Docker/Compose/volumes` →
contenedores · `nginx proxy` → reverse proxy · `Actions + secrets` → CI/CD ·
`cron + mysqldump` → backups · `nip.io` → DNS.

Con ese mapa, cualquier tutorial de AWS, Docker o Kubernetes se vuelve legible.

---

*Guía escrita el 2026-11-24 junto con la ejecución real de la Fase G.
Comandos exactos: `DEPLOY.md` · Estado del proyecto: `AGENTS.md`.*
