import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import compression from 'compression';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(compression());
app.use(express.json());

// Proxy requests to /api to the json-server on port 3000
app.all('/api/{*splat}', (req, res) => {
  const targetPath = req.originalUrl.replace(/^\/api/, '');
  const targetUrl = `http://localhost:3000${targetPath}`;

  const options: RequestInit = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    options.body = JSON.stringify(req.body);
  }

  fetch(targetUrl, options)
    .then(async (response) => {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        res.status(response.status).json(data);
      } else {
        const text = await response.text();
        res.status(response.status).send(text);
      }
    })
    .catch((err) => {
      console.error('[SSR API Proxy Error]:', err);
      res.status(502).json({ error: 'Bad Gateway', message: 'Local API server (json-server) is not running on port 3000.' });
    });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
