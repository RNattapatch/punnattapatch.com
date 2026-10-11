// Funnel Lab media (2026-10-12): the image or video a touchpoint is sent with.
// Pure helpers shared by the page (validate before upload), storage (validate saved state) and the Mac mini worker
// (frame plan, transcript parsing, prompt addendum). The file lives in the private Storage bucket `funnel-lab-media`
// at `<creativeId>/<sha256>.<ext>`; the sha256 is part of the touchpoint's content revision, so replacing the file
// makes earlier results stale exactly like editing the text does.
import { isSafeId } from './ids.mjs';

export const MEDIA_BUCKET = 'funnel-lab-media';
export const MEDIA_MAX_BYTES = 50 * 1024 * 1024;   // bucket file_size_limit
export const MEDIA_MAX_VIDEO_SECONDS = 180;         // longer clips are judged on their first 3 minutes
const EXT = Object.freeze({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' });
const SHA256 = /^[0-9a-f]{64}$/u;

export function mediaKind(mime) {
  return EXT[mime] ? (mime.startsWith('video/') ? 'video' : 'image') : null;
}

export function mediaPath(creativeId, sha256, mime) {
  return `${creativeId}/${sha256}.${EXT[mime]}`;
}

/** Reject a file before uploading (type and size the bucket would refuse anyway, with a Thai reason). */
export function checkUpload(file) {
  if (!mediaKind(file?.type)) return 'รองรับเฉพาะรูป JPG / PNG / WebP และวิดีโอ MP4 / MOV / WebM';
  if (!(file.size > 0)) return 'ไฟล์ว่าง';
  if (file.size > MEDIA_MAX_BYTES) return `ไฟล์ใหญ่เกิน ${MEDIA_MAX_BYTES / 1024 / 1024} MB — ย่อหรือตัดคลิปก่อนอัปโหลด`;
  return '';
}

export function isMedia(media, creativeId) {
  if (media === undefined || media === null) return true;
  if (typeof media !== 'object' || Array.isArray(media)) return false;
  const kind = mediaKind(media.mime);
  return kind !== null && media.kind === kind && SHA256.test(media.sha256 ?? '') && isSafeId(creativeId ?? '')
    && media.path === mediaPath(creativeId, media.sha256, media.mime)
    && Number.isFinite(media.size) && media.size > 0 && media.size <= MEDIA_MAX_BYTES
    && typeof media.name === 'string' && media.name.length <= 200
    && (media.durationSec === undefined || (Number.isFinite(media.durationSec) && media.durationSec >= 0 && media.durationSec < 86_400));
}

/**
 * Which frames the mini extracts (same idea as scout's contact sheets): the opening seconds densely — that is where
 * a viewer decides to stop — then the rest of the clip sparsely, each tiled into one image so Codex sees it in few tokens.
 */
export function framePlan(durationSec) {
  const duration = Math.max(0, Math.min(Number(durationSec) || 0, MEDIA_MAX_VIDEO_SECONDS));
  const hookSeconds = Math.min(6, duration || 6);
  const hookFps = 4;                                 // a frame every 0.25 s
  const hookFrames = Math.max(1, Math.round(hookSeconds * hookFps));
  const rest = Math.max(0, duration - hookSeconds);
  const bodyFrames = rest > 1 ? Math.min(16, Math.max(4, Math.round(rest / 4))) : 0;
  return Object.freeze({
    duration,
    hook: Object.freeze({ seconds: hookSeconds, fps: hookFps, frames: hookFrames, cols: Math.min(6, hookFrames), rows: Math.ceil(hookFrames / 6) }),
    body: bodyFrames ? Object.freeze({ start: hookSeconds, seconds: rest, frames: bodyFrames, every: rest / bodyFrames, cols: 4, rows: Math.ceil(bodyFrames / 4) }) : null,
  });
}

function srtTime(value) {
  const match = /^(\d+):(\d{2}):(\d{2})[,.](\d{1,3})$/u.exec(value.trim());
  return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4].padEnd(3, '0')) / 1000 : null;
}

/** whisper-cli -osrt output → [{start, end, text}] (blank/garbage cues dropped). */
export function parseSrt(text) {
  const cues = [];
  for (const block of String(text ?? '').replace(/\r/g, '').split(/\n\s*\n/u)) {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const timing = lines.findIndex((line) => line.includes('-->'));
    if (timing < 0) continue;
    const [from, to] = lines[timing].split('-->');
    const start = srtTime(from);
    const end = srtTime(to);
    const words = lines.slice(timing + 1).join(' ').trim();
    if (start === null || end === null || !words || /^\[.*\]$/u.test(words)) continue;
    cues.push({ start, end, text: words.slice(0, 500) });
  }
  return cues;
}

function clock(seconds) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}.${Math.round((seconds - whole) * 10)}`;
}

/** Extra instructions + data for a Codex run that sees the real image / frames. The transcript is client content → untrusted. */
// transcript: 'ok' | 'none_detected' | 'no_audio' | 'unavailable' (whisper failed or model missing) — never pretend silence.
export function buildMediaAddendum({ kind, plan = null, cues = [], imageCount = 1, transcript = cues.length ? 'ok' : 'none_detected' }) {
  const lines = ['', 'MEDIA: the touchpoint is delivered with real media, attached as image(s) to this prompt.'];
  if (kind === 'image') {
    lines.push('Image 1 is the exact visual the recipient sees with this message.',
      'Judge the visual component from the image itself (what is readable in 2 seconds, faces/product, contrast, text legibility on a phone), not from the visualDirection text.');
  } else {
    lines.push(`Image 1 is the very first frame (what shows before anyone decides to keep watching).`);
    if (plan?.hook && imageCount > 1) lines.push(`Image 2 is a grid of the opening ${plan.hook.seconds.toFixed(1)} s, one frame every ${(1 / plan.hook.fps).toFixed(2)} s, read left→right, top→bottom.`);
    if (plan?.body && imageCount > 2) lines.push(`Image 3 is a grid of the rest (${plan.body.frames} frames, one every ${plan.body.every.toFixed(1)} s from ${plan.body.start.toFixed(1)} s), read left→right, top→bottom.`);
    lines.push('Judge hook from the first 3 seconds (frames + speech), visual from what the frames show, and copy/offer from speech + on-screen text together with the written message.',
      'Music, tone of voice and motion between frames are NOT visible to you: do not claim them; say so in assumptions if they would matter.');
  }
  if (kind === 'video') {
    lines.push('<untrusted_transcript>');
    const empty = { no_audio: '(the video has no audio track)', unavailable: '(transcript unavailable — speech could not be transcribed; do not assume the clip is silent)', none_detected: '(audio present, no speech detected)' };
    lines.push(cues.length ? cues.slice(0, 120).map((cue) => `[${clock(cue.start)}–${clock(cue.end)}] ${cue.text}`).join('\n').replace(/</g, '\\u003c') : (empty[transcript] ?? empty.none_detected));
    lines.push('</untrusted_transcript>');
  }
  return lines.join('\n');
}
