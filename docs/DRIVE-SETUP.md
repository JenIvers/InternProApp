# Google Drive upload: one-time setup

The Portfolio's **Upload ▸ From Google Drive** option uses the Google Picker with the
`drive.file` scope (the app only sees files the user picks). It stays disabled
("Not set up yet") until the three values in `driveConfig.ts` are filled in.

Project: `intern-pro-app` (Firebase / Google Cloud).

## 1. Enable the APIs

```bash
gcloud services enable picker.googleapis.com drive.googleapis.com --project intern-pro-app
```

## 2. Browser API key (`apiKey`)

Cloud Console ▸ APIs & Services ▸ Credentials ▸ Create credentials ▸ API key.
Restrict it:
- Application restrictions: **Websites**; add `https://intern-pro-app.web.app/*`,
  `https://intern-pro-app.firebaseapp.com/*`, `http://localhost:3000/*`
  (and any preview-channel hosts you use).
- API restrictions: **Google Picker API** and **Google Drive API**.

## 3. OAuth consent screen

APIs & Services ▸ OAuth consent screen. Add the scope
`https://www.googleapis.com/auth/drive.file`. This scope is "sensitive":
for **External** apps Google may require verification before non-test users can
consent; add testers while in testing mode. If every user is on one Google
Workspace domain, an **Internal** app avoids verification, but the project must
live in that Workspace organisation, and the Workspace admin may still block
third-party apps from Drive.

## 4. OAuth client ID (`clientId`)

Credentials ▸ Create credentials ▸ OAuth client ID ▸ **Web application**.
Authorized JavaScript origins: the same hosts as the API key (no paths).
No redirect URIs are needed (token flow in a popup).

## 5. Project number (`appId`)

```bash
gcloud projects describe intern-pro-app --format="value(projectNumber)"
```

## 6. Fill in `driveConfig.ts`, build, deploy

These are public identifiers, restricted by the referrer / origin rules above.
After deploying, "From Google Drive" becomes active.

## Notes

- Files over 10 MB are rejected (same limit as computer uploads).
- Google Docs / Slides / Sheets are exported to PDF; everything else is copied as-is.
- Imported files are copied into Firebase Storage, so they keep working if the
  Drive file is later moved, unshared, or deleted.
