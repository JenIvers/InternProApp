import { DRIVE_CONFIG, isDriveConfigured } from './driveConfig';

/**
 * Pick a file from Google Drive and return it as a `File`, ready to go through
 * the normal Storage upload. Uses the `drive.file` scope: the app only ever
 * sees files the user explicitly selects in the picker.
 */

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const MAX_BYTES = 10 * 1024 * 1024; // matches storageService / storage.rules

// Minimal structural types for the two Google script globals we use.
interface TokenResponse { access_token?: string; error?: string }
interface TokenClient { requestAccessToken: (opts?: { prompt?: string }) => void }
interface PickerDoc { id: string; name: string; mimeType: string; sizeBytes?: number }
interface PickerResponse { action: string; docs?: PickerDoc[] }
interface PickerBuilder {
  setOAuthToken: (t: string) => PickerBuilder;
  setDeveloperKey: (k: string) => PickerBuilder;
  setAppId: (id: string) => PickerBuilder;
  addView: (v: unknown) => PickerBuilder;
  setCallback: (cb: (r: PickerResponse) => void) => PickerBuilder;
  build: () => { setVisible: (v: boolean) => void };
}
interface GoogleGlobals {
  accounts?: { oauth2: { initTokenClient: (cfg: {
    client_id: string; scope: string;
    callback: (r: TokenResponse) => void;
    error_callback?: (e: { type: string }) => void;
  }) => TokenClient } };
  picker?: {
    PickerBuilder: new () => PickerBuilder;
    DocsView: new () => { setIncludeFolders: (b: boolean) => unknown; setMimeTypes: (m: string) => unknown };
    Action: { PICKED: string; CANCEL: string };
  };
}
interface WindowWithGoogle extends Window {
  google?: GoogleGlobals;
  gapi?: { load: (name: string, cb: () => void) => void };
}
const w = (): WindowWithGoogle => window as WindowWithGoogle;

const scripts = new Map<string, Promise<void>>();
function loadScript(src: string): Promise<void> {
  const existing = scripts.get(src);
  if (existing) return existing;
  const p = new Promise<void>((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      scripts.delete(src);
      reject(new Error('Could not load Google services. Check your connection.'));
    };
    document.head.appendChild(el);
  });
  scripts.set(src, p);
  return p;
}

async function loadGoogle(): Promise<void> {
  await Promise.all([
    loadScript('https://accounts.google.com/gsi/client'),
    loadScript('https://apis.google.com/js/api.js'),
  ]);
  await new Promise<void>((resolve) => w().gapi!.load('picker', () => resolve()));
}

function requestToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = w().google!.accounts!.oauth2.initTokenClient({
      client_id: DRIVE_CONFIG.clientId,
      scope: SCOPE,
      callback: (r) => (r.access_token ? resolve(r.access_token) : reject(new Error(r.error || 'Google Drive access was not granted.'))),
      error_callback: (e) => reject(new Error(e.type === 'popup_closed' ? 'cancelled' : 'Google Drive access was not granted.')),
    });
    client.requestAccessToken();
  });
}

function pickDocument(token: string): Promise<PickerDoc | null> {
  return new Promise((resolve) => {
    const g = w().google!.picker!;
    const view = new g.DocsView();
    view.setIncludeFolders(true);
    new g.PickerBuilder()
      .setOAuthToken(token)
      .setDeveloperKey(DRIVE_CONFIG.apiKey)
      .setAppId(DRIVE_CONFIG.appId)
      .addView(view)
      .setCallback((r) => {
        if (r.action === g.Action.PICKED && r.docs?.[0]) resolve(r.docs[0]);
        else if (r.action === g.Action.CANCEL) resolve(null);
      })
      .build()
      .setVisible(true);
  });
}

const GOOGLE_APPS_PREFIX = 'application/vnd.google-apps.';

async function downloadAsFile(token: string, doc: PickerDoc): Promise<File> {
  const isGoogleDoc = doc.mimeType.startsWith(GOOGLE_APPS_PREFIX);
  if (doc.mimeType === `${GOOGLE_APPS_PREFIX}folder`) throw new Error('Pick a file, not a folder.');
  if (doc.sizeBytes && doc.sizeBytes > MAX_BYTES) {
    throw new Error(`File too large (${(doc.sizeBytes / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
  }

  // Docs / Slides / Sheets have no bytes of their own: export them as PDF.
  const url = isGoogleDoc
    ? `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=application%2Fpdf`
    : `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Google Drive could not provide that file (${res.status}).`);
  const blob = await res.blob();
  if (blob.size > MAX_BYTES) {
    throw new Error(`File too large (${(blob.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`);
  }
  const name = isGoogleDoc && !/\.pdf$/i.test(doc.name) ? `${doc.name}.pdf` : doc.name;
  return new File([blob], name, { type: isGoogleDoc ? 'application/pdf' : blob.type || doc.mimeType });
}

export type DriveResult =
  | { status: 'picked'; file: File }
  | { status: 'cancelled' }
  | { status: 'error'; error: string };

export { isDriveConfigured };

/** Run the full flow: sign-in/consent, picker, download. Never throws. */
export async function pickFileFromDrive(): Promise<DriveResult> {
  if (!isDriveConfigured()) return { status: 'error', error: 'Google Drive is not set up for this app yet.' };
  try {
    await loadGoogle();
    const token = await requestToken();
    const doc = await pickDocument(token);
    if (!doc) return { status: 'cancelled' };
    return { status: 'picked', file: await downloadAsFile(token, doc) };
  } catch (e) {
    if (e instanceof Error && e.message === 'cancelled') return { status: 'cancelled' };
    return { status: 'error', error: e instanceof Error ? e.message : 'Google Drive import failed.' };
  }
}
