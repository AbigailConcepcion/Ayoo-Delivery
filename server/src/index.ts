import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { setupRoutes } from './routes.js';
import { initDb } from './db.js';

declare const process: any;

// load environment variables from .env file
dotenv.config();

export function createServer() {
  const app = express();
  app.use(cors({ origin: true }));
  app.use(morgan('combined'));
  app.use(express.json({
    verify: (req: any, _res: any, buf: Buffer) => {
      req.rawBody = buf.toString('utf8');
    }
  }));

  // initialize database
  initDb();

  // register routes
  setupRoutes(app);

  // global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

const app = createServer();
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Ayoo API server running on http://localhost:${port}`);
});
