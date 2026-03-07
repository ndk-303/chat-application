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
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000', // Update with frontend URL if different
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

connectDB();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', routes);

export default app;
