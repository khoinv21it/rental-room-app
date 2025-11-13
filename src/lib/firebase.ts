// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID
} from "@env";

const firebaseConfig = {
  // apiKey: "AIzaSyAQlyKAIkkMoXN88jKwIFsjeWzNq4zowoY",
  // authDomain: "chatweb-78d98.firebaseapp.com",
  // projectId: "chatweb-78d98",
  // storageBucket: "chatweb-78d98.firebasestorage.app",
  // messagingSenderId: "604423699850",
  // appId: "1:604423699850:web:225895d6000ae8e04b5c73",
  // measurementId: "G-BQBB733K6T"
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app); // Thêm dòng này để export auth