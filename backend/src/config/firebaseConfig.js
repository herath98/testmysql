// src/config/firebaseConfig.js
import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Server-side Firebase Admin SDK initialization
const firebaseAdminCredentials = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(firebaseAdminCredentials)
});

// Client-side Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBxedg21Tvx5l9J_C4igA4FrfLF58oc2xU",
    authDomain: "test123-715af.firebaseapp.com",
    projectId: "test123-715af",
    storageBucket: "test123-715af.firebasestorage.app",
    messagingSenderId: "15828738888",
    appId: "1:15828738888:web:b7f7dba130a7e209dec97d"
};

// Initialize Firebase for client-side
const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export {
  admin,
  firebaseAuth,
  googleProvider,
  firebaseApp
};