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

APIs & Services ▸ OAuth consent screen (Google Auth Platform ▸ Branding / Audience / Data Access).
Add the scope `https://www.googleapis.com/auth/drive.file`. It only grants access to
files the user explicitly picks, and Google classes it as non-sensitive (the console
labels each scope, so confirm when you add it).

Audience must be **External**: **Internal** requires the project to belong to a Google
Workspace organisation (this project has no parent organisation) and would exclude
anyone outside that domain. With a non-sensitive scope you can set the publishing
status to **In production** without Google verification, so no test-user list is needed.
If the console does label the scope sensitive, stay in Testing and add test users.

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

## Status (2026-10-12)

Done via CLI: Picker + Drive APIs enabled; referrer-restricted API key
"InternPro Drive picker (browser)" created; `driveConfig.ts` filled in using the
existing Firebase Google sign-in web client
(`788133827557-03fnpdbqrr9ah8gqgaqsds68np3ga16l…`) and project number `788133827557`.

Still console-only: (a) add `https://intern-pro-app.web.app` and
`https://intern-pro-app.firebaseapp.com` (and `http://localhost:3000` for dev) to that
client's **Authorized JavaScript origins**; (b) add the `drive.file` scope to the
OAuth consent screen (Audience: **External**, since the project has no parent
organisation; publish to production if the scope is non-sensitive).
