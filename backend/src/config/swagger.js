// src/config/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Registration API',
      version: '1.0.0',
      description: 'API documentation for user registration system'
    },
    servers: [
      {
        url: 'http://localhost:8081',
        description: 'Development server'
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Updated path for route documentation
};

export default swaggerJsdoc(swaggerOptions);