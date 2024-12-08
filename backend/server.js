import 'dotenv/config';
import 'module-alias'
import { EventEmitter } from 'events';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './src/config/swagger.js';
import userRoutes from './src/routes/userRoutes.js';

// Increase max listeners
EventEmitter.defaultMaxListeners = 15;

const app = express();

// Middleware
app.use(cors({ 
  origin: process.env.FRONTEND_URL || "http://localhost:3000" || "http://localhost:3001",
}));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Start server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
