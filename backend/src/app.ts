import express from 'express';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index'
import connectDB from './config/database'
import swaggerSpec from './config/swagger'
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
connectDB();

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', routes);

export default app;
