import express from 'express';
import os from 'os';
import routes from './routes/index'
import connectDB from './config/database'
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { generalLimiter } from './middlewares/rateLimiter';
dotenv.config();

const CONTAINER_ID = os.hostname();
const app = express();
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        // T-015: restrict ngrok to known ngrok domains only (not a substring match)
        if (/^https?:\/\/[a-z0-9-]+\.ngrok(\.io|\.app|-free\.app)?$/i.test(origin)) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} không được phép`));
    },
    credentials: true,
}));

// T-041: Explicit body size limit prevents large-payload DoS
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// T-042: Security headers middleware
app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.removeHeader('X-Powered-By');
    next();
});

app.use('/api', generalLimiter);

// ─── Scale-demo middleware: log which container handles each request ──────────
app.use('/api', (req, _res, next) => {
    const ts = new Date().toISOString();
    console.log(`Container=${CONTAINER_ID} | ${req.method} ${req.originalUrl} | ${ts}`);
    next();
});
// ─────────────────────────────────────────────────────────────────────────────

connectDB();

app.use('/api', routes);

export default app;
