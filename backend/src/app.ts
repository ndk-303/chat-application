import express from 'express';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index'
import connectDB from './config/database'
import swaggerSpec from './config/swagger'
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
dotenv.config();

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Cho phép requests không có origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        // Cho phép tất cả ngrok URLs
        if (origin.includes('ngrok')) return callback(null, true);
        // Cho phép các origins trong whitelist
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} không được phép`));
    },
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

connectDB();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', routes);

export default app;
