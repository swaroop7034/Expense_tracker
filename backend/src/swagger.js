import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './config/env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PG Expense Tracker API',
      version: '1.0.0',
      description: 'API documentation for the PG Expense Tracker backend',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Local development server',
      },
    ],
  },
  // Document all routes
  apis: ['./src/api/v1/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
