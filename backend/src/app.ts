import express from 'express';
import routes from './routes/index'
import connectDB from './config/database'
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { generalLimiter } from './middlewares/rateLimiter';
dotenv.config();

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (origin.includes('ngrok')) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} không được phép`));
    },
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use('/api', generalLimiter);

connectDB();

app.use('/api', routes);

export default app;
