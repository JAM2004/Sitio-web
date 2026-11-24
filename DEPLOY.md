# Despliegue — CIE Conecta (Fase G)

Guía completa para llevar el proyecto a producción y sacarle el máximo valor al
CV. Está pensada para seguirse paso a paso desde cero, aunque ya hayas usado
AWS.

**Decisiones cerradas** (no reabrir sin motivo):

| Decisión | Elección | Por qué |
|---|---|---|
| Proveedor | **AWS EC2** con los créditos del Free plan ($100 / 6 meses) | Palabras clave reales de AWS (EC2, security groups, EBS) sin pagar; plan B listo por si acaban los créditos |
| Instancia | **t4g.small** (2 vCPU, 2 GB, ARM) ≈ $12/mes → cabe en los $100 los 6 meses | Sobra para nginx + Node + MySQL con swap de 2 GB |
| Contenedores | **Docker Compose** (app + MySQL 8 + nginx) | Mismo artefacto en local y en producción; migrar de proveedor = 30 min |
| Dominio | **`<IP>.nip.io`** (gratis, resuelve solo) | Link funcional el día 1 sin comprar nada |
| HTTPS | **Día 1: HTTP.** Opción gratis tardía (eu.org) u opción $10-15 (dominio + Cloudflare) — ver §G4 | Cloudflare solo funciona con una zona (dominio) a tu nombre |
| CI/CD | **GitHub Actions** → lint → SSH → `git pull` + `docker compose build` | Keyword "CI/CD" y deploy sin tocar el servidor |
| Backup | cron diario: `mysqldump` + tar de `uploads` | "¿Y si se cae la BD?" ya tiene respuesta |

**Costo real:** $0 durante 6 meses (créditos AWS + nip.io) → después ~$12/mes
en AWS o ~€6/mes migrando a Hetzner (plan B, §G9). Dominio opcional $10-15/año.

---

## Arquitectura

```
                        Internet (HTTP el día 1; HTTPS con Cloudflare si compras dominio)
                                  │
                     ┌────────────▼────────────┐
                     │   EC2 t4g.small (AWS)   │  Ubuntu 24.04 + Docker
                     │   IP elástica + nip.io  │
                     │  ┌───────────────────┐  │
   navegador ───────►│  │ contenedor `web`  │  │  nginx: sirve client/dist,
                     │  │  puerto 80        │  │  proxy /api y /uploads
                     │  └────────┬──────────┘  │
                     │           │ red interna │
                     │  ┌────────▼──────────┐  │
                     │  │ contenedor `app`  │  │  Node/Express (API + multer)
                     │  │  puerto 3001      │  │  UPLOADS_DIR → volumen uploads
                     │  └────────┬──────────┘  │
                     │  ┌────────▼──────────┐  │
                     │  │ contenedor `db`   │  │  MySQL 8 (volumen db-data)
                     │  │  puerto 3306*     │  │  *no expuesto afuera
                     │  └───────────────────┘  │
                     └────────────────────────┘

  Push a main ──► GitHub Actions (lint) ──► SSH ──► git pull + compose build
```

---

## G1 — Cuenta AWS y instancia EC2

1. **Cuenta**: entra a <https://aws.amazon.com/free>, **Create an AWS account**
   (selecciona **Free plan**; te dan $100 de crédito y no se cobra nada hasta
   que lo mejores). Te avisarán por correo al 50/25/10% del crédito.
   ⚠️ Cuando venzan los 6 meses la cuenta se cierra sola: **migra antes** (§G9).
2. **Consola EC2** → *Launch instance*:
   - **Name**: `cie-conecta`
   - **AMI**: *Ubuntu Server 24.04 LTS* (la variante **arm64**, compatible con t4g)
   - **Instance type**: `t4g.small` (2 vCPU / 2 GB)
   - **Key pair**: *Create new* → nombre `cie-conecta` → formato **.pem**
     (PowerShell/`ssh` usa .pem; si usas PuTTY, conviértelo con PuTTYgen a .ppk)
   - **Network**: security group nuevo con estas reglas:

     | Tipo | Puerto | Origen | Para qué |
     |---|---|---|---|
     | SSH | 22 | Tu IP (no `0.0.0.0/0`) | Entrar al servidor |
     | HTTP | 80 | 0.0.0.0/0 | La app (y ACME si algún día usas certbot) |
     | HTTPS | 443 | 0.0.0.0/0 | Por si activas TLS en origen |

   - **Storage**: **30 GB** gp3 (con 8 GB no alcanzan las imágenes Docker).
3. **IP elástica** (importante con nip.io, porque el hostname *contiene* la IP):
   EC2 → *Elastic IPs* → *Allocate* → *Associate* con la instancia.
   Es **gratis mientras esté asociada a una instancia en marcha**; sin ella, si
   paras la instancia la IP cambia y tu link nip.io se rompe.
4. **Conexión desde PowerShell** (Windows trae `ssh`):

   ```powershell
   ssh -i "C:\ruta\cie-conecta.pem" ubuntu@<TU-IP-ELASTICA>
   ```

   Si dice *"UNPROTECTED PRIVATE KEY FILE"*, Windows es quisquilloso con los
   permisos (PowerShell como admin):

   ```powershell
   icacls "C:\ruta\cie-conecta.pem" /inheritance:r /grant "${env:USERNAME}:R"
   ```

## G2 — Docker en la instancia

```bash
# dentro de la instancia (usuario ubuntu)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrup docker 2>/dev/null || newgrp docker   # aplica el grupo sin re-login
docker --version && docker compose version
```

Añade también swap de 2 GB (protege el `vite build` en una caja de 2 GB):

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # debe mostrar 2G de swap
```

## G3 — Primer arranque

```bash
git clone https://github.com/JAM2004/Sitio-web.git
cd Sitio-web

# secrets: cópialos a .env (nunca entra a git; está en .gitignore)
cp .env.example .env
openssl rand -hex 24   # genera una clave para DB_PASS
openssl rand -hex 24   # otra para JWT_SECRET
nano .env              # pega los dos valores

docker compose up -d --build     # primera vez: 3-8 min (npm ci + vite build)
docker compose ps                # los 3 servicios deben estar "running"
docker compose logs -f app       # espera "El servidor está corriendo"
```

El **dump se importa solo**: `server/login.sql` está montado en
`/docker-entrypoint-initdb.d/` y MySQL lo corre en el **primer** arranque del
volumen `db-data`. Único usuario: `admin@empresa.com` / `admin1`.

Comprobación rápida:

```bash
curl -sI http://localhost/ | head -1                    # HTTP 200
curl -s -X POST http://localhost/api/login -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"admin1"}'   # devuelve token
```

Abre `http://<TU-IP-ELASTICA>.nip.io` en el navegador → login con
`admin@empresa.com` / `admin1`.

## G4 — DNS y HTTPS (nip.io el día 1; candado después)

**Día 1 (gratis, sin tocar nada):** nip.io resuelve cualquier `<IP>.nip.io` a
esa IP sin registrarte en ningún lado. Ya lo tienes: `http://<IP>.nip.io`.
El navegador mostrará *"No seguro"* porque es HTTP puro.

**Opción A — $10-15/año (la que más suma al CV):** compra un dominio
(`tunombre.dev`, `tunombre.com`) en cualquier registradora, apunta los
**nameservers a Cloudflare** (plan gratis) y crea un registro:

```
Type A   Name: @      Content: <TU-IP-ELASTICA>   Proxy: sí (nube naranja)
Type A   Name: www    Content: <TU-IP-ELASTICA>   Proxy: sí
```

Con Cloudflare en modo **Flexible** el candado aparece **sin cambiar nada en
nginx** (Cloudflare termina el TLS y conecta a tu origen por el puerto 80).
*Mejora posterior (5 min):* en Cloudflare SSL → *Full (strict)* + *Origin
Certificate* instalado en el contenedor `web` para cifrar también el tramo
Cloudflare↔origen; los pasos exactos están en la guía de Cloudflare.

**Opción B — $0 con HTTPS (tardía):** regístrate en **eu.org** (subdominio
gratis, su aprobación tarda días/semanas), añádelo como zona a Cloudflare y
usa la opción A. Mientras tanto, sigue el link nip.io.

**Opción C — $0 total:** déjalo en HTTP con nip.io. Funciona; solo pierde el
candado. (Vercel/Netlify no sirven de atajo: romperían las subidas de imagen
y no tienen MySQL.)

## G5 — CI/CD con GitHub Actions

Ya existe `.github/workflows/deploy.yml`: en cada `git push` a `main` corre
**ESLint** (client y server) y, si pasa, entra por SSH al servidor, hace
`git pull` y `docker compose up -d --build --force-recreate web`.

Configúralo una sola vez:

1. Genera la clave de despliegue **en la instancia**:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
   cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
   ```
2. En GitHub → repo → *Settings* → *Secrets and variables* → *Actions* → *New repository secret*:

   | Secreto | Valor |
   |---|---|
   | `EC2_HOST` | Tu IP elástica (o `<IP>.nip.io`) |
   | `EC2_USER` | `ubuntu` |
   | `EC2_KEY` | Contenido completo de `~/.ssh/deploy_key` (clave privada) |

3. Empuja y mira la pestaña *Actions*:

   ```powershell
   git add -A ; git commit -m "Despliegue" ; git push
   ```

`--force-recreate web` es a propósito: nginx re-resuelve la IP interna del
contenedor `app` al recrearse (si no, conserva la IP vieja y responde 502).

## G6 — Backups (cron)

```bash
mkdir -p ~/backups
crontab -e
```

Añade (ajusta el nombre del volumen si cambiaste el `name:` del compose):

```cron
# 03:00 dump diario de MySQL (lee la contraseña del entorno del contenedor)
0 3 * * * docker exec $(docker ps -qf ancestor=mysql:8.0) sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" login' | gzip > $HOME/backups/login-$(date +\%F).sql.gz
# 03:30 respaldo de las imágenes subidas
30 3 * * * docker run --rm -v cie-conecta_uploads:/u:ro -v $HOME/backups:/b alpine tar czf /b/uploads-$(date +\%F).tar.gz -C /u .
# limpia respaldos de más de 30 días
0 4 * * * find $HOME/backups -name '*.gz' -mtime +30 -delete
```

Verifica con `crontab -l` y revisa `~/backups` al día siguiente.

## G7 — Pruebas N1-N6 (aceptación del despliegue)

| # | Prueba | Cómo | Esperado |
|---|---|---|---|
| N1 | SPA servida | `curl -sI http://<host>/` | `200` y HTML con `<div id="root">` |
| N2 | Proxy de la API | `curl -s -X POST http://<host>/api/login -H "Content-Type: application/json" -d '{"email":"admin@empresa.com","password":"admin1"}'` | JSON con `token` |
| N3 | Login en navegador | Abrir `http://<host>` y entrar con `admin@empresa.com` / `admin1` | Entra al panel |
| N4 | Página pública | Crear un evento → abrir `/evento/<slug>` en ventana privada | Renderiza con su contenido (no vacía) |
| N5 | Persistencia de imágenes | Subir una imagen en el editor → `docker compose restart app` → recargar | La imagen sigue ahí (volumen `uploads`) |
| N6 | Reconstrucción total | `docker compose down && docker compose up -d` | Todo vuelve con los mismos datos y usuarios (volúmenes) |

## G8 — Lista del CV (lo que el reclutador ve)

- [ ] Repo con **description** y **topics** (`react`, `express`, `mysql`,
      `nginx`, `docker`, `jwt`, `ci-cd`) y **licencia MIT** (LICENSE ya está en
      el repo; activa *Add license* en GitHub o deja que lo detecte).
- [ ] **README**: sección *Deployment* (apunta a este DEPLOY.md), diagrama de
      arquitectura y badges:
      `![CI/CD](https://github.com/JAM2004/Sitio-web/actions/workflows/deploy.yml/badge.svg)`
- [ ] **GIF de 10 s** del editor arrastrando bloques, subido al README.
- [ ] Link vivo en el CV y LinkedIn (el dominio que tengas).
- [ ] Bullet sugerido en el CV:
      *«Despliegue full-stack en AWS EC2 con Docker Compose (nginx + Node/Express +
      MySQL 8), CI/CD con GitHub Actions y backups automáticos.»*

## G9 — Plan B: cuando acaben los créditos (o acabes la búsqueda)

Migrar a **Hetzner** (~€6/mes, 4 GB) sin perder nada — el Docker Compose es
idéntico, solo cambia la máquina:

1. Hetzner Cloud → servidor (Ubuntu 24.04, ~€6/mes) + IP pública.
2. Repite **G2** (Docker + swap) y **G3** (clone + `.env`) en la nueva caja.
3. Copia los datos:
   ```bash
   # en la instancia VIEJA
   docker exec $(docker ps -qf ancestor=mysql:8.0) sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" login' > dump-final.sql
   docker run --rm -v cie-conecta_uploads:/u:ro -v $PWD:/b alpine tar czf /b/uploads.tar.gz -C /u .
   scp dump-final.sql uploads.tar.gz ubuntu@<NUEVA-IP>:~
   ```
4. En la NUEVA: pon `dump-final.sql` en `server/login.sql` (o déjalo como
   está si quieres arrancar limpio), `docker compose up -d --build`, y sube
   `uploads.tar.gz` al volumen `cie-conecta_uploads`.
5. Apunta nip.io/Cloudflare a la IP nueva y actualiza el secreto `EC2_HOST`.

Misma historia para la entrevista: *«migré la infraestructura entre proveedores
con cero downtime de datos gracias a que todo estaba contenedorizado»*.

## Problemas conocidos

| Síntoma | Causa y arreglo |
|---|---|
| `vite build` se queda sin memoria | Falta el swap de G2 (`free -h` debe mostrar 2G) |
| El sitio responde **502** | nginx conserva la IP vieja del `app`: `docker compose restart web` |
| `db` reinicia en loop | `docker compose logs db` (¿el dump tiene error?); para re-importar: `docker compose down -v && docker compose up -d` ⚠️ borra datos |
| Cambié `.env` y no hace nada | `docker compose up -d` recrea los contenedores con los nuevos valores |
| El build de CI falla en `npm ci` | El lockfile no está commiteado: commitea `package-lock.json` de client y server |
| Acaban los créditos AWS | Migrar a Hetzner **antes** (§G9); revisa el saldo en *Billing → Credits* |
