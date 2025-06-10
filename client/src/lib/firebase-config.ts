import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAFbqkAtEvQroMp1zGYvfjIPOYXWTZSBmg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rotiniel-35c5b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rotiniel-35c5b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rotiniel-35c5b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "546264380520",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:546264380520:web:7034e18e1211898418f7dd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Connetti agli emulatori in sviluppo
if (import.meta.env.DEV) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
  }
}

export default app;