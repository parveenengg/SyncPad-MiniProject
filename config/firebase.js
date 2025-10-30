/**
 * Firebase Admin initialization (Firestore)
 */

const admin = require('firebase-admin');
const logger = require('../utils/logger');

let appInitialized = false;

function initFirebase() {
  if (appInitialized) return admin;

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_DATABASE_URL
  } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    logger.warn('Firebase env vars missing; skipping Firebase initialization');
    return null;
  }

  try {
    const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey
      }),
      databaseURL: FIREBASE_DATABASE_URL || undefined
    });
    appInitialized = true;
    logger.info('Firebase initialized (Firestore)');
    return admin;
  } catch (err) {
    logger.error('Failed to initialize Firebase:', err);
    return null;
  }
}

function getFirestore() {
  const app = initFirebase();
  if (!app) return null;
  return admin.firestore();
}

module.exports = { initFirebase, getFirestore };


