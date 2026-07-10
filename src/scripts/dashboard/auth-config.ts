// Google Sign-In (GIS) client config for the dashboard.
//
// Replace __GOOGLE_CLIENT_ID__ with the OAuth 2.0 *Web* Client ID from
// Google Cloud Console (APIs & Services → Credentials). It looks like:
//   123456789-abcdef.apps.googleusercontent.com
//
// This value is PUBLIC by design (it ships in the browser bundle). Security
// does NOT depend on keeping it secret — it depends on:
//   1. Authorized JavaScript origins in GCP = https://app.punnattapatch.com
//      (the private app hub — the dashboard moved here from the root domain).
//      Keep https://punnattapatch.com listed only until the app-subdomain
//      cutover is verified, then remove it.
//   2. The backend (dashboard-api.gs) verifying the ID token + email allowlist
//
// The SAME Client ID must be set as GOOGLE_CLIENT_ID in the Apps Script
// Script Properties so the backend's `aud` check matches.
export const GOOGLE_CLIENT_ID = '480908944227-dm9a8q28k8ec79no1n89dgabp5mtg4sd.apps.googleusercontent.com';
