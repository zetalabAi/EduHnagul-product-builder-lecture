import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider, Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, Functions, connectFunctionsEmulator } from "firebase/functions";

// Check if Firebase config is available
const hasFirebaseConfig = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
};

// Initialize Firebase (always initialize with config or demo values)
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const functions: Functions = getFunctions(app);

// Connect to emulators in development
if (typeof window !== "undefined" && window.location.hostname === "localhost") {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
    connectFunctionsEmulator(functions, "localhost", 5001);
    console.log("🔧 Connected to Firebase Emulators");
  } catch (error) {
    // Emulators already connected, ignore error
  }
}

if (!hasFirebaseConfig) {
  console.warn("⚠️ Firebase configuration not found. Running in demo mode.");
  console.warn("📝 Create .env.local file with Firebase credentials to enable full functionality.");
}

// Export
export { auth, db, functions };
export const isFirebaseConfigured = hasFirebaseConfig;

// Auth providers (only if Firebase is configured)
export const googleProvider = auth ? new GoogleAuthProvider() : null;
export const microsoftProvider = auth ? new OAuthProvider("microsoft.com") : null;
export const appleProvider = auth ? new OAuthProvider("apple.com") : null;

export default app;
