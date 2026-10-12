/**
 * Google Drive picker configuration. These are public client identifiers (like
 * the Firebase web config), restricted server-side by HTTP referrer / authorized
 * JavaScript origins in Google Cloud Console — not secrets.
 *
 * Until all three are filled in, the "From Google Drive" upload option is shown
 * as unavailable. See docs/DRIVE-SETUP.md.
 */
export const DRIVE_CONFIG = {
  /** Browser API key with Picker API + Drive API enabled, referrer-restricted. */
  apiKey: 'AIzaSyCF1P-oyscj4ScFFMPJgQYZ_Q855GoBWp8',
  /** OAuth 2.0 Web client ID (authorized JS origins must include the app's origins). */
  clientId: '788133827557-03fnpdbqrr9ah8gqgaqsds68np3ga16l.apps.googleusercontent.com',
  /** Google Cloud project NUMBER (the Picker "app id"). */
  appId: '788133827557',
};

export const isDriveConfigured = (): boolean =>
  Boolean(DRIVE_CONFIG.apiKey && DRIVE_CONFIG.clientId && DRIVE_CONFIG.appId);
