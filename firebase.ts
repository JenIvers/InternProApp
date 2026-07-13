import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Serve the OAuth helper from the SAME origin as the app whenever we're on a
// Firebase Hosting domain (Hosting exposes /__/auth/* on every domain of the
// project, including preview channels). With the default cross-origin
// authDomain, Safari's storage partitioning drops the redirect result in
// installed iOS PWAs and sign-in loops back to the login screen. The domain
// must also be listed in Firebase Auth's authorized domains.
const isFirebaseHostedOrigin =
  typeof window !== 'undefined' &&
  (window.location.hostname.endsWith('.web.app') ||
    window.location.hostname.endsWith('.firebaseapp.com'));

const firebaseConfig = {
  apiKey: "AIzaSyCYtLJxoQjmcZdFvAbp_syVs1Ti5aXX3tQ",
  authDomain: isFirebaseHostedOrigin ? window.location.hostname : "intern-pro-app.firebaseapp.com",
  projectId: "intern-pro-app",
  storageBucket: "intern-pro-app.firebasestorage.app",
  messagingSenderId: "788133827557",
  appId: "1:788133827557:web:6fdec9f03fcabf8bf5150c",
  measurementId: "G-8V86JG2SSW"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Firestore with persistent local cache for offline support.
// ignoreUndefinedProperties: the whole AppState is serialized on every save and
// has many optional fields (siteId, hourSplit, meetingNotes, shelfId, ...) that
// sit as `undefined` in React state. Firestore rejects nested `undefined` with
// "Unsupported field value: undefined", which was aborting entry saves; dropping
// undefined keys on write (equivalent to omitting them) is the correct behavior
// for optional fields and is applied globally so no future field can regress it.
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

const storage = getStorage(app);
const auth = getAuth(app);

export { app, analytics, db, storage, auth };
