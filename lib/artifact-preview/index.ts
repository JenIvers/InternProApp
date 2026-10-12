/**
 * artifact-preview — decide how an artifact should be previewed.
 *
 * The stored `type` is whatever `File.type` was at upload time, which is empty
 * for some files (HEIC photos from iOS, unusual extensions) and absent on very
 * old records. So the kind is resolved from, in order: the mime type, the
 * data-URL prefix (legacy inline base64 artifacts), then the file extension in
 * the artifact name or in the Firebase Storage URL path.
 */

export type ArtifactKind = 'image' | 'pdf' | 'video' | 'audio' | 'other';

interface ArtifactLike {
  name: string;
  type: string;
  data: string;
}

const EXTENSION_KINDS: Record<string, ArtifactKind> = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
  heic: 'image', heif: 'image', avif: 'image', bmp: 'image', svg: 'image',
  pdf: 'pdf',
  mp4: 'video', mov: 'video', m4v: 'video', webm: 'video',
  mp3: 'audio', m4a: 'audio', wav: 'audio', aac: 'audio', ogg: 'audio',
};

function kindFromMime(mime: string): ArtifactKind | undefined {
  const m = mime.toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m === 'application/pdf') return 'pdf';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  return undefined;
}

function extensionOf(path: string): string | undefined {
  const last = path.split('/').pop() ?? '';
  const dot = last.lastIndexOf('.');
  return dot > 0 ? last.slice(dot + 1).toLowerCase() : undefined;
}

/** The storage object path inside a Firebase download URL, decoded. */
function storagePathOf(url: string): string | undefined {
  const match = /\/o\/([^?]+)/.exec(url);
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return undefined;
  }
}

export function resolveArtifactKind(artifact: ArtifactLike): ArtifactKind {
  const fromType = kindFromMime(artifact.type ?? '');
  if (fromType) return fromType;

  if (artifact.data.startsWith('data:')) {
    const mime = /^data:([^;,]+)/.exec(artifact.data)?.[1];
    const fromData = mime ? kindFromMime(mime) : undefined;
    if (fromData) return fromData;
  }

  const candidates = [artifact.name, storagePathOf(artifact.data)];
  for (const candidate of candidates) {
    const ext = candidate ? extensionOf(candidate) : undefined;
    if (ext && EXTENSION_KINDS[ext]) return EXTENSION_KINDS[ext];
  }
  return 'other';
}

/** Short human label for a kind, e.g. in a header or chip. */
export function kindLabel(kind: ArtifactKind): string {
  switch (kind) {
    case 'image': return 'Image';
    case 'pdf': return 'PDF';
    case 'video': return 'Video';
    case 'audio': return 'Audio';
    default: return 'File';
  }
}

/**
 * Whether the browser can render a PDF inline in an iframe. iOS Safari shows
 * only the first page (or a blank frame) there, so it gets an Open button.
 */
export function canEmbedPdf(userAgent: string, maxTouchPoints: number): boolean {
  const iOS = /iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  return !iOS;
}
