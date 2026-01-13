import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { AppState } from "./types";

const COLLECTION_NAME = "intern_data";

export const saveStateToFirestore = async (userId: string, state: AppState) => {
  if (!userId) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    await setDoc(docRef, state);
  } catch (error) {
    console.error("Error saving state to Firestore:", error);
  }
};

export const loadStateFromFirestore = async (userId: string): Promise<AppState | null> => {
  if (!userId) return null;
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as AppState;
    }
    return null;
  } catch (error) {
    console.error("Error loading state from Firestore:", error);
    return null;
  }
};
