/**
 * app.ts - Main Express application server
 * 
 * This is the entry point for the donation management backend API.
 * It sets up the Express server with all necessary middleware and routes.
 * 
 * Features:
 * - CORS enabled for frontend communication
 * - JSON body parsing
 * - Request logging
 * - Error handling middleware
 * - RESTful API routes
 * - Health check endpoint
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';

// Initialize Express application
const app: Express = express();
const PORT = process.env.PORT || 5000;

/**
 * Middleware Configuration
 */

// Enable CORS for all routes - allows frontend to communicate with backend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Vite and CRA default ports
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

/**
 * Request Logging Middleware
 * Logs all incoming requests for debugging and monitoring
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  
  // Log request body for POST/PUT requests (excluding sensitive data)
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  
  next();
});

/**
 * API Routes
 * All routes are prefixed with /api
 */
app.use('/api', routes);

/**
 * Root endpoint - provides API information
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Donation Management API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      donations: {
        getAll: 'GET /api/donations',
        create: 'POST /api/donations',
        update: 'PUT /api/donations/:id',
        delete: 'DELETE /api/donations/:id',
        getById: 'GET /api/donations/:id'
      }
    },
    documentation: 'See README.md for detailed API documentation'
  });
});

/**
 * Global Error Handling Middleware
 * Catches all unhandled errors and returns consistent error responses
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('💥 Unhandled error:', error);
  
  // Send error response based on environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: isDevelopment ? error.message : 'Something went wrong',
    stack: isDevelopment ? error.stack : undefined
  });
});

/**
 * 404 Handler for undefined routes
 * Handles requests to non-existent endpoints
 */
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    suggestion: 'Check the API documentation for available endpoints'
  });
});

/**
 * Start the server
 * Initialize the HTTP server and display startup information
 */
const server = app.listen(PORT, () => {
  console.log('\n🏠 Donation Management System - Backend');
  console.log('==========================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`❤️  Ready to help manage shelter donations!`);
  console.log('\n📋 Available endpoints:');
  console.log('  GET    /api/health        - Health check');
  console.log('  GET    /api/donations     - Get all donations');
  console.log('  POST   /api/donations     - Create donation');
  console.log('  PUT    /api/donations/:id - Update donation');
  console.log('  DELETE /api/donations/:id - Delete donation');
  console.log('  GET    /api/donations/:id - Get single donation');
  console.log('\n💡 Test the API: http://localhost:5000/api/health');
  console.log('');
});

/**
 * Graceful Shutdown Handler
 * Properly closes server and database connections on shutdown signals
 */
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;