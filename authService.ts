import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

const provider = new GoogleAuthProvider();
const REDIRECT_KEY = 'auth_redirect_pending';

export const checkRedirectResult = async (): Promise<User | null> => {
  // Only check redirect result if we initiated a redirect
  const isPending = sessionStorage.getItem(REDIRECT_KEY);
  if (!isPending) {
    console.log("No pending redirect, skipping getRedirectResult");
    return null;
  }

  try {
    console.log("Checking redirect result (pending flag found)...");
    const result = await getRedirectResult(auth);

    // Clear the flag regardless of result
    sessionStorage.removeItem(REDIRECT_KEY);

    if (result) {
      console.log("Redirect auth successful:", result.user.email);
      return result.user;
    }

    console.log("getRedirectResult returned null (user may already be signed in via auth state)");
    return null;
  } catch (error) {
    sessionStorage.removeItem(REDIRECT_KEY);
    console.error("Error handling redirect result:", error);
    return null;
  }
};

export const signInWithGoogle = async (): Promise<void> => {
  try {
    const userAgent = navigator.userAgent || navigator.vendor || (window as { opera?: string }).opera || "";
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as { MSStream?: unknown }).MSStream;
    const isAndroid = /Android/.test(userAgent);
    const isMobile = isIOS || isAndroid;
    const isStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone ||
                         window.matchMedia('(display-mode: standalone)').matches;

    console.log("Auth attempt:", { isMobile, isIOS, isAndroid, isStandalone });

    // For PWAs and mobile, use redirect (popups are unreliable)
    if (isMobile || isStandalone) {
      // Set flag BEFORE redirect so we know to check result on return
      sessionStorage.setItem(REDIRECT_KEY, 'true');
      await signInWithRedirect(auth, provider);
    } else {
      // Desktop: try popup first
      try {
        await signInWithPopup(auth, provider);
      } catch (popupError) {
        console.log("Popup failed, falling back to redirect:", popupError);
        sessionStorage.setItem(REDIRECT_KEY, 'true');
        await signInWithRedirect(auth, provider);
      }
    }
  } catch (error) {
    console.error("Error signing in with Google:", error);
    sessionStorage.removeItem(REDIRECT_KEY);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
