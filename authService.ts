import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

const provider = new GoogleAuthProvider();

export const checkRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    }
    return null;
  } catch (error) {
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

    // For PWAs on iOS, signInWithRedirect is often more reliable than popup
    // which can be blocked or cause context loss.
    if (isMobile || isStandalone) {
      await signInWithRedirect(auth, provider);
    } else {
      await signInWithPopup(auth, provider);
    }
  } catch (error) {
    console.error("Error signing in with Google:", error);
    // Fallback logic
    try {
      await signInWithRedirect(auth, provider);
    } catch (e) {
      console.error("Error signing in with Google (Fallback):", e);
    }
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
