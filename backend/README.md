# Backend Lex Laboral

API del generador de borradores legales (Hono + Node.js + TypeScript).

## Requisitos

- Node.js >= 20

## Configuración

```bash
cp .env.example .env
# Llenar GEMINI_API_KEY, SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
```

## Desarrollo

```bash
npm install
npm run dev
```

El servidor escucha en `http://localhost:3000`. El endpoint principal es
`POST /api/draft` (streaming SSE), el mismo contrato que consumía la app desde Vercel.

## Producción

```bash
npm run build
npm start
```

## Despliegue en PaaS (Render o Railway)

- Comando de build: `cd backend && npm install && npm run build`
- Comando de start: `cd backend && npm start`
- Variables de entorno: `PORT`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS` (opcional)
- Healthcheck: `GET /health`

## Endpoints

| Método | Ruta          | Descripción                              |
| ------ | ------------- | ---------------------------------------- |
| GET    | /health       | Healthcheck                              |
| POST   | /api/draft    | Genera borrador legal (SSE)              |

## Protección

- Rate limit: 5 solicitudes/minuto por IP en `/api/draft`.
- `CORS_ORIGINS`: restricción opcional de origins; vacío permite todos.
- `sanitizeInput`: limita el tamaño del payload (5 000 caracteres).
