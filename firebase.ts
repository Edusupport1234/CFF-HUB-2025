import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import firebaseAppletConfig from "./firebase-applet-config.json";

// We are adding the databaseURL manually as per your current setup
const firebaseConfig = {
  ...firebaseAppletConfig,
  databaseURL: "https://cff-video-hub-6c3bf-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const db = getDatabase(app);
const auth = getAuth(app);

// Export only what you need
export { app, db, auth };