import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCYtLJxoQjmcZdFvAbp_syVs1Ti5aXX3tQ",
  authDomain: "intern-pro-app.firebaseapp.com",
  projectId: "intern-pro-app",
  storageBucket: "intern-pro-app.firebasestorage.app",
  messagingSenderId: "788133827557",
  appId: "1:788133827557:web:6fdec9f03fcabf8bf5150c",
  measurementId: "G-8V86JG2SSW"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, analytics, db, storage, auth };
