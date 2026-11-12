// Public identity of the multi-tenant Meta app that the /hub pages describe.
// Rename the service here once. Every /hub page imports META_APP from this file.

export const META_APP = {
  // Working name shown on every hub page (Thai and English sections).
  name: 'AI Office Inbox',
  // Last-updated date shown on the pages.
  updatedEn: '13 November 2026',
  updatedTh: '13 พฤศจิกายน 2569',
  // Status page for a Facebook data-deletion request (the ?code= value is added by the user).
  deletionStatusUrl: 'https://hub.punnattapatch.com/meta/deletion-status',
} as const;
