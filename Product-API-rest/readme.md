# Backend API

API de ecommerce en Node.js, Express y MongoDB. La imagen publicada está en [Docker Hub](https://hub.docker.com/r/tomascastelluccio/backend3/tags).

## Requisitos

- Docker Desktop instalado y en ejecución.
- Docker Compose v2 (`docker compose`).

## Ejecutar desde Docker Hub

Desde una terminal, ubicarse en la carpeta `Product-API-rest` y descargar la imagen:

```powershell
docker pull tomascastelluccio/backend3:latest
```

Iniciar la API y MongoDB con Compose:

```powershell
docker compose up -d
```

Compose usa la imagen de Docker Hub y crea un contenedor MongoDB. Los datos de MongoDB y los archivos de la API se conservan en volúmenes de Docker.

## Construir la imagen localmente

Desde `Product-API-rest`, construir la imagen a partir del Dockerfile:

```powershell
docker build -t backend3-api:local .
```

## Ejecutar los contenedores manualmente

Primero iniciar MongoDB con un volumen persistente:

```powershell
docker run -d --name backend3-mongo -p 27017:27017 -v backend3-mongo-data:/data/db mongo:7
```

Esperar a que MongoDB responda antes de iniciar la API:

```powershell
docker exec backend3-mongo mongosh --quiet --eval "db.adminCommand('ping').ok"
```

Después iniciar la API construida localmente. En Docker Desktop para Windows, `host.docker.internal` permite que la API llegue al contenedor MongoDB publicado en el host:

```powershell
docker run -d --name backend3-api -p 8080:8080 `
  -e NODE_ENV=development `
  -e PORT=8080 `
  -e MONGO_URI=mongodb://host.docker.internal:27017/ecommerce `
  -e JWT_SECRET=local-development-secret-change-me-32chars `
  -e FRONTEND_URL=http://localhost:8080 `
  -e MAIL_TRANSPORT=console `
  -v backend3-api-data:/app/data `
  backend3-api:local
```

Para ejecutar manualmente la imagen descargada de Docker Hub, reemplazar `backend3-api:local` por `tomascastelluccio/backend3:latest`.

Consultar logs o detener los contenedores iniciados manualmente:

```powershell
docker logs -f backend3-api
docker stop backend3-api backend3-mongo
```

## Acceder a la aplicación

- API: <http://localhost:8080>
- Estado de la API: <http://localhost:8080/api/health>
- Swagger UI: <http://localhost:8080/api-docs>

En Swagger, use **Authorize** para ingresar un JWT como `Bearer <token>`. Para obtenerlo, envíe credenciales a `POST /api/sessions/login`; el registro está disponible en `POST /api/sessions/register`. Los endpoints de administración requieren un usuario con rol `admin`.

Algunos endpoints útiles:

- `GET /api/products`: listar productos (público).
- `GET /api/pets`: listar mascotas.
- `GET /api/users`: listar usuarios (requiere JWT de administrador).
- `GET /api/orders`: listar órdenes del usuario autenticado; administrador ve todas.
- `POST /api/mocks/generateData`: crear datos de prueba; recibe `users` y `pets` en JSON.

Ejemplo de generación de datos desde PowerShell:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:8080/api/mocks/generateData `
  -ContentType "application/json" `
  -Body '{"users":5,"pets":3}'
```

Ejemplo para registrar e iniciar sesión y consultar la sesión actual con el JWT:

```powershell
$newUser = @{
  first_name = "Antonio"
  last_name = "Fuoco"
  email = "antonio@example.com"
  age = 28
  password = "claveSegura123"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri http://localhost:8080/api/sessions/register `
  -ContentType "application/json" `
  -Body $newUser

$login = Invoke-RestMethod -Method Post `
  -Uri http://localhost:8080/api/sessions/login `
  -ContentType "application/json" `
  -Body (@{ email = "antonio@example.com"; password = "claveSegura123" } | ConvertTo-Json)

$token = $login.token
Invoke-RestMethod -Uri http://localhost:8080/api/sessions/current `
  -Headers @{ Authorization = "Bearer $token" }
```

Verificar que los contenedores estén activos y consultar los logs:

```powershell
docker compose ps
docker compose logs -f app
```

Detener los contenedores, conservando los datos:

```powershell
docker compose down
```

## Configuración

Compose usa `.env.example` con valores locales para desarrollo y mailing por consola. Para cambiar el `JWT_SECRET`, definí esa variable en un archivo `.env` en esta carpeta; Compose lo toma como valor de reemplazo. No uses el secreto de ejemplo fuera del entorno local.

Al ejecutar con `docker run`, los valores de entorno se pasan con `-e`; configurá `MONGO_URI`, `JWT_SECRET` y `FRONTEND_URL`. No publiques una imagen que contenga secretos reales.

Para actualizar a la última imagen publicada:

```powershell
docker compose pull
docker compose up -d
```
