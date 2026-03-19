import http from 'http';
import app from './app';
import { initSocket } from './socket/socketManager';

const port: number = Number(process.env.PORT) || 5051;

const httpServer = http.createServer(app);

initSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});