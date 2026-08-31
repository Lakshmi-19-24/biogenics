import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import path from 'node:path';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import xss from 'xss-clean';

import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { apiRouter } from './routes/index.js';

export const app = express();

app.set('trust proxy', 1);
app.set('etag', false);

/*
 * =========================================================
 * CORS
 * =========================================================
 *
 * The production website may be opened with:
 *
 * https://biogenicslifecare.com
 * https://www.biogenicslifecare.com
 *
 * Both must be allowed.
 */

const allowedOrigins = new Set([
  env.CLIENT_URL,
  'https://biogenicslifecare.com',
  'https://www.biogenicslifecare.com',
  'http://localhost:5173',
]);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser tools / requests without Origin
      if (!origin) {
        return cb(null, true);
      }

      // Allow production and local development origins
      if (allowedOrigins.has(origin)) {
        return cb(null, true);
      }

      // Dev convenience: allow any Vite localhost port
      if (
        env.NODE_ENV === 'development' &&
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        return cb(null, true);
      }

      console.warn(`CORS blocked for origin: ${origin}`);

      return cb(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },

    credentials: true,
  })
);

/*
 * =========================================================
 * RATE LIMITING
 * =========================================================
 */

app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/*
 * =========================================================
 * BODY PARSERS
 * =========================================================
 */

app.use(
  express.json({
    limit: '2mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '2mb',
  })
);

app.use(cookieParser());

/*
 * =========================================================
 * STATIC UPLOADS
 * =========================================================
 */

app.use(
  '/uploads',
  express.static(path.resolve('uploads'))
);

/*
 * =========================================================
 * SECURITY MIDDLEWARE
 * =========================================================
 */

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

/*
 * =========================================================
 * DEVELOPMENT LOGGER
 * =========================================================
 */

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/*
 * =========================================================
 * HEALTH CHECK
 * =========================================================
 */

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
  });
});

/*
 * =========================================================
 * API CACHE CONTROL
 * =========================================================
 */

app.use('/api', (_req, res, next) => {
  res.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate'
  );

  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  next();
});

/*
 * =========================================================
 * API ROUTES
 * =========================================================
 */

app.use('/api/v1', apiRouter);

/*
 * =========================================================
 * ERROR HANDLING
 * =========================================================
 */

app.use(notFound);
app.use(errorHandler);