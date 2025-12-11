// Import the functions you need from the SDKs you need
import { initializeApp, setLogLevel } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeAuth,
  getAuth,
  // @ts-ignore - React Native persistence is available but TypeScript types might not be updated
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} from "@env";

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
// Enable verbose debug logs for Firebase SDK (useful for diagnosing connection/timeouts)
try {
  setLogLevel("debug");
  // Print only project id to verify env vars loaded (don't log secret keys)
  // eslint-disable-next-line no-console
  console.debug("Firebase projectId:", firebaseConfig.projectId);
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn("Failed to set Firebase log level or print config", e);
}
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Firebase Auth with AsyncStorage persistence for React Native
let authInstance;
try {
  // Try to initialize auth with React Native persistence
  authInstance = initializeAuth(app, {
    // @ts-ignore
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log("✅ Firebase Auth initialized with AsyncStorage persistence");
} catch (error: any) {
  // If already initialized, just get the existing instance
  if (error?.code === "auth/already-initialized") {
    authInstance = getAuth(app);
    console.log("ℹ️ Firebase Auth already initialized");
  } else {
    console.error("❌ Firebase Auth initialization error:", error);
    throw error;
  }
}

export const auth = authInstance;
