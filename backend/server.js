import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import teamRoutes from './routes/teamRoutes.js';
import round1Routes from './routes/round1Routes.js';
import round2Routes from './routes/round2Routes.js';
import round3Routes from './routes/round3Routes.js';
import adminRoutes from './routes/adminRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// CORS Configuration
const corsOptions = {
  origin: '*',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Handle preflight requests
app.options('*', cors(corsOptions));

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TechSymphony - Restore Neurovia API',
    version: '1.0.0',
    event: {
      name: 'TechSymphony',
      theme: 'Restore Neurovia',
      date: process.env.EVENT_DATE,
      time: process.env.EVENT_TIME,
      venue: process.env.VENUE
    }
  });
});

// API Routes
app.use('/api/teams', teamRoutes);
app.use('/api/round1', round1Routes);
app.use('/api/round2', round2Routes);
app.use('/api/round3', round3Routes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 TechSymphony - Restore Neurovia API             ║
║                                                       ║
║   Server running in ${process.env.NODE_ENV || 'development'} mode               ║
║   Port: ${PORT}                                      ║
║                                                       ║
║   📡 API Endpoints:                                   ║
║   - Teams:  /api/teams                                ║
║   - Round1: /api/round1                               ║
║   - Round2: /api/round2                               ║
║   - Round3: /api/round3                               ║
║   - Admin:  /api/admin                                ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  // Close server & exit process
  process.exit(1);
});
