import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middlewares/error.middleware';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

dotenv.config();

const app = express();
// When deployed behind a reverse proxy (nginx, cloud load balancers) express needs to trust the proxy
// so secure cookies and protocol detection work correctly. Enable trust proxy in production.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
// enable CORS for the frontend and allow cookies + csrf header
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true, allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'], methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'] }));

// security headers
app.use(helmet());
import { csrfProtection } from './middlewares/csrf.middleware';
app.use(cookieParser());
app.use(express.json());

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Employee Management API',
      version: '1.0.0'
    }
  },
  apis: ['./src/routes/*.ts']
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// CSRF protection for state-changing routes
app.use(csrfProtection);

// apply rate limiting to auth endpoints to mitigate brute force
import rateLimit from 'express-rate-limit';
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: 'Too many requests, please try again later.' });
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: 'Too many admin requests, slow down.' });
const employeeLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, message: 'Too many requests, try again shortly.' });
app.use('/auth', authLimiter, authRoutes);
app.use('/employees', employeeLimiter, employeeRoutes);
app.use('/admins', adminLimiter, adminRoutes);

app.get('/', (_req: any, res: any) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'dev' }));

app.use(errorHandler);

export default app;
