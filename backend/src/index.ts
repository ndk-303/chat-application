import http from 'http';
import os from 'os';
import app from './app';
import { initSocket } from './socket/socketManager';
import { connectRedis } from './config/redis';

const port: number = Number(process.env.PORT) || 5051;
export const CONTAINER_ID = os.hostname();

async function bootstrap() {
  await connectRedis();
  console.log('[Bootstrap] Redis connected');

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Container ID: ${CONTAINER_ID}`);
  });
}

bootstrap().catch((err) => {
  console.error('[Bootstrap] Fatal error during startup:', err);
  process.exit(1);
});