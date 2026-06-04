// Google Sign-In (GIS) client config for the dashboard.
//
// Replace __GOOGLE_CLIENT_ID__ with the OAuth 2.0 *Web* Client ID from
// Google Cloud Console (APIs & Services → Credentials). It looks like:
//   123456789-abcdef.apps.googleusercontent.com
//
// This value is PUBLIC by design (it ships in the browser bundle). Security
// does NOT depend on keeping it secret — it depends on:
//   1. Authorized JavaScript origins set to https://punnattapatch.com (GCP)
//   2. The backend (dashboard-api.gs) verifying the ID token + email allowlist
//
// The SAME Client ID must be set as GOOGLE_CLIENT_ID in the Apps Script
// Script Properties so the backend's `aud` check matches.
export const GOOGLE_CLIENT_ID = '__GOOGLE_CLIENT_ID__';
