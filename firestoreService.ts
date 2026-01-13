import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { AppState } from "./types";

const COLLECTION_NAME = "intern_data";
const DOCUMENT_ID = "default_user"; // We can change this to a real user ID later with Auth

export const saveStateToFirestore = async (state: AppState) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    await setDoc(docRef, state);
  } catch (error) {
    console.error("Error saving state to Firestore:", error);
  }
};

export const loadStateFromFirestore = async (): Promise<AppState | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
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
