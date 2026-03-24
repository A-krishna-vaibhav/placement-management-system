/**
 * Server Entry Point
 * ──────────────────
 * Starts the Express server on the configured port.
 */

const app = require('./app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀  PMS Backend running on http://localhost:${PORT}`);
  console.log(`📋  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗  Health check: http://localhost:${PORT}/api/health\n`);
});
