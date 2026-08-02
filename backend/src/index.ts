import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { draftRoute } from './routes/draft.js';
import { securityHeaders, isAllowedRequestOrigin } from './lib/security.js';

const app = new Hono();

app.use('*', logger());
app.use('*', securityHeaders);

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return undefined;
      if (isAllowedRequestOrigin(origin)) return origin;
      return undefined;
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86400,
  })
);

app.get('/health', (c) => c.json({ status: 'ok', uptime: process.uptime() }));

app.route('/api', draftRoute);

app.notFound((c) => c.json({ error: 'Ruta no encontrada' }, 404));

const port = Number(process.env.PORT || 3000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[Lex Laboral Backend] escuchando en http://localhost:${info.port}`);
});
