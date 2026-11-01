// Start a WarRoomGate app exactly once, whichever happens first: the gate's "authed" event, or the app already revealed.
//
// Why: WarRoomGate unhides the app and fires its event the moment it restores a saved session. A page module that
// finishes loading after that moment misses the event and never loads any data. Seen 2026-11-01 on /gateway once its
// bundle grew (blank chat list, data intact); Funnel Lab had hit it before and fixed it locally with this same check.
export function onAuthed(appId: string, event: string, boot: () => unknown): void {
  let booted = false;
  const start = () => {
    if (booted) return;
    booted = true;
    void boot();
  };
  document.addEventListener(event, start, { once: true });
  const app = document.getElementById(appId);
  if (app && !app.classList.contains('hidden')) start();
}
