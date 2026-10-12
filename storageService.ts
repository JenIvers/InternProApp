import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a file to Firebase Storage
 * @param userId - The user's unique ID
 * @param file - The file to upload
 * @param artifactId - The artifact's unique ID
 * @returns Upload result with URL or error
 */
export const uploadFileToStorage = async (
  userId: string,
  file: File,
  artifactId: string
): Promise<UploadResult> => {
  if (!userId || !file || !artifactId) {
    return { success: false, error: "Missing required parameters" };
  }

  // Check file size (limit to 10MB to be safe)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`
    };
  }

  try {
    // Create a reference to the file in storage
    // Path: artifacts/{userId}/{artifactId}/{filename}
    const fileExtension = file.name.split('.').pop();
    const storagePath = `artifacts/${userId}/${artifactId}.${fileExtension}`;
    const storageRef = ref(storage, storagePath);

    // Upload the file
    await uploadBytes(storageRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error("Error uploading file to Firebase Storage:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
};

/**
 * Delete a file from Firebase Storage
 * @param fileUrl - The full download URL of the file
 * @returns Success status
 */
export const deleteFileFromStorage = async (fileUrl: string): Promise<boolean> => {
  if (!fileUrl) return false;

  try {
    // Extract the path from the download URL
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error("Error deleting file from Firebase Storage:", error);
    return false;
  }
};

const MAX_MENTOR_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB (photos are resized well below this)

/**
 * Upload a mentor portrait. Each upload gets a fresh object name so a replaced
 * photo is never served stale from a browser/CDN cache.
 * Path: mentors/{userId}/{mentorId}-{timestamp}.jpg
 */
export const uploadMentorPhoto = async (
  userId: string,
  mentorId: string,
  photo: Blob
): Promise<UploadResult> => {
  if (!userId || !mentorId || !photo) {
    return { success: false, error: "Missing required parameters" };
  }
  if (photo.size > MAX_MENTOR_PHOTO_SIZE) {
    return { success: false, error: "That photo is too large. Try a smaller image." };
  }
  try {
    const storageRef = ref(storage, `mentors/${userId}/${mentorId}-${Date.now()}.jpg`);
    await uploadBytes(storageRef, photo, { contentType: "image/jpeg" });
    return { success: true, url: await getDownloadURL(storageRef) };
  } catch (error) {
    console.error("Error uploading mentor photo to Firebase Storage:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
};
