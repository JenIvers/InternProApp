/**
 * Browser image helpers (canvas). Not unit-tested: they need a real DOM.
 */

/**
 * Decode `file` and re-encode it as a JPEG whose longest side is at most
 * `maxSide` px. Honours EXIF orientation (createImageBitmap does by default),
 * so phone portraits come out upright. Rejects with a readable message when
 * the browser can't decode the file.
 */
export async function resizeImageToJpeg(file: File, maxSide = 1000, quality = 0.85): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error("That image couldn't be read. Try a JPG or PNG.");
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("This browser can't process images.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("That image couldn't be processed."))),
      'image/jpeg',
      quality
    );
  });
}
