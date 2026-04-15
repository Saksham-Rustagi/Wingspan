import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

function missingEnvKeys(): string[] {
  const entries: [string, string | undefined][] = [
    ['VITE_FIREBASE_API_KEY', firebaseConfig.apiKey],
    ['VITE_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
    ['VITE_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
    ['VITE_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket],
    ['VITE_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId],
    ['VITE_FIREBASE_APP_ID', firebaseConfig.appId],
    ['VITE_FIREBASE_MEASUREMENT_ID', firebaseConfig.measurementId],
  ];
  return entries.filter(([, v]) => !v).map(([k]) => k);
}

const missing = missingEnvKeys();
if (missing.length > 0) {
  throw new Error(
    `Missing Firebase env: ${missing.join(', ')}. Copy .env.example to .env.local and fill values.`,
  );
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
