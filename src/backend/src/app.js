/**
 * Express Application
 * ───────────────────
 * Configures middleware and mounts route modules.
 * Exported separately from server.js for testing.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

/* ────────── Security ────────── */
app.use(helmet());

/* ────────── CORS ────────── */
app.use(cors({
origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ────────── Body Parsing ────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ────────── Logging ────────── */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

/* ────────── Rate Limiting ────────── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});
app.use('/api/', limiter);

/* ────────── Health Check ────────── */
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'PMS Backend is running.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/* ────────── Routes ────────── */
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);

/* ────────── Error Handling ────────── */
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
