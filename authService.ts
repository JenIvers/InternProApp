import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

const provider = new GoogleAuthProvider();
// Always show Google's account chooser. Without this, signing out clears only
// Firebase's session while Google's SSO session persists, so the next sign-in
// silently reuses the same account and the user can never switch accounts.
provider.setCustomParameters({ prompt: 'select_account' });
const REDIRECT_KEY = 'auth_redirect_pending';

export const checkRedirectResult = async (): Promise<User | null> => {
  // Always call getRedirectResult: iOS standalone PWAs frequently return from
  // the OAuth redirect in a fresh browsing context where sessionStorage is
  // empty, so gating on the pending flag dead-ends the sign-in. The call is a
  // cheap no-op when there is no pending redirect; the flag is kept only for
  // logging.
  const isPending = sessionStorage.getItem(REDIRECT_KEY);

  try {
    console.log(`Checking redirect result (pending flag ${isPending ? 'found' : 'absent'})...`);
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

    // Redirect only in the installed/standalone PWA, where popups are
    // unreliable. In mobile *browsers*, redirect silently loses the result
    // when the page origin differs from authDomain (third-party storage
    // partitioning — e.g. on hosting preview channels), so popup is safer.
    if (isStandalone) {
      // Set flag BEFORE redirect so we know to check result on return
      sessionStorage.setItem(REDIRECT_KEY, 'true');
      await signInWithRedirect(auth, provider);
    } else {
      // Browsers (desktop and mobile): try popup first
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
