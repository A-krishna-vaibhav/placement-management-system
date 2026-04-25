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

const authRoutes         = require('./routes/authRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const referenceRoutes    = require('./routes/referenceRoutes');
const declarationRoutes  = require('./routes/declarationRoutes');
const profileRoutes      = require('./routes/profileRoutes');
const companyRoutes      = require('./routes/companyRoutes');
const jobRoutes          = require('./routes/jobRoutes');
const applicationRoutes  = require('./routes/applicationRoutes');
const statsRoutes        = require('./routes/statsRoutes');
const facultyRoutes      = require('./routes/facultyRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

/* ────────── Security ────────── */
app.use(helmet());

/* ────────── CORS (SRS QA-S3) ────────── */
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3001')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Allow server-to-server / curl / Postman
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods:        ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:    false,
}));

/* ────────── Body Parsing ────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ────────── Logging ────────── */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

/* ────────── Rate Limiting (SRS QA-S3) ────────── */

// Unauthenticated entry routes — 20 req/minute per IP
const authLessLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      20,
  message:  { success: false, message: 'Too many requests. Please try again shortly.' },
});

// Authenticated endpoints — 100 req/minute per IP
const authedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      100,
  message:  { success: false, message: 'Rate limit exceeded.' },
});

app.use('/api/register',         authLessLimiter);
app.use('/api/login',            authLessLimiter);
app.use('/api/forgot-password',  authLessLimiter);
app.use('/api/verify-login-otp', authLessLimiter);
app.use('/api/',                 authedLimiter);

/* ────────── Health Check ────────── */
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success:     true,
    message:     'PMS Backend is running.',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/* ────────── Routes ────────── */
app.use('/api',                 authRoutes);
app.use('/api/admin',           adminRoutes);
app.use('/api/reference',       referenceRoutes);
app.use('/api/declarations',    declarationRoutes);
app.use('/api/profile',         profileRoutes);
app.use('/api/company',         companyRoutes);
app.use('/api/jobs',            jobRoutes);
app.use('/api/applications',    applicationRoutes);
app.use('/api/stats',           statsRoutes);
app.use('/api/faculty',         facultyRoutes);

/* ────────── Error Handling ────────── */
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
