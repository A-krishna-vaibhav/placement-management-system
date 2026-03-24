/**
 * Firebase Admin SDK Configuration
 * ─────────────────────────────────
 * Initialises the Firebase Admin SDK using environment variables.
 * Provides Firestore DB and Auth instances for the rest of the app.
 */

const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// The firebase-admin credential expects the service account object keys
// to match the JSON key names used in Google service account files
// (snake_case): project_id, client_email, private_key.
const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  // Replace escaped newlines so the PEM parses correctly
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
