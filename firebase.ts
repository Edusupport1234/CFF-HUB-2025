
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAnczjOrCIBCWCVpO1OccZaFQvUExtTIHc",
  authDomain: "cff-video-hub-6c3bf.firebaseapp.com",
  databaseURL: "https://cff-video-hub-6c3bf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "cff-video-hub-6c3bf",
  storageBucket: "cff-video-hub-6c3bf.firebasestorage.app",
  messagingSenderId: "542446140641",
  appId: "1:542446140641:web:6f71b6341d1b287d918ba0",
  measurementId: "G-DR5D82NPBX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Analytics is optional and might fail in some environments
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn("Firebase Analytics failed to initialize:", e);
  }
}

export { app, db, analytics };
