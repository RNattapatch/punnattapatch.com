// ปุ่มไมค์ของช่องพิมพ์ใน /office — อัดเสียงในเบราว์เซอร์ → office-transcribe (ElevenLabs Scribe) → ต่อท้ายข้อความในช่องให้แก้ก่อนส่ง
// ไม่ส่งเองอัตโนมัติ: คุณปันตรวจคำที่ถอดได้ก่อนกดส่งเสมอ (แบบปุ่ม dictate ของ Claude/Codex)

export const MAX_RECORD_MS = 5 * 60_000;
export const MIN_RECORD_MS = 700;
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

export function pickMimeType(isSupported: (type: string) => boolean): string {
  return MIME_CANDIDATES.find((type) => isSupported(type)) || '';
}

export function fileExtension(mime: string): string {
  return mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
}

export function appendTranscript(current: string, text: string): string {
  const spoken = text.trim();
  if (!spoken) return current;
  if (!current.trim()) return spoken;
  return /\s$/.test(current) ? current + spoken : `${current} ${spoken}`;
}

// ช่องพิมพ์โตตามข้อความ (สูงสุดราว 6 บรรทัด) ให้อ่านทวนคำที่ถอดจากเสียงได้ก่อนส่ง · เรียกซ้ำทุกครั้งที่ค่าเปลี่ยนจากโค้ด
export function fitTextarea(input: HTMLTextAreaElement, maxPx = 168): void {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, maxPx)}px`;
  input.style.overflowY = input.scrollHeight > maxPx ? 'auto' : 'hidden';
}

export function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

interface DictationParts {
  button: HTMLButtonElement;
  input: HTMLTextAreaElement;
  status: HTMLElement;
  errorBox: HTMLElement;
  transcribe: (audio: Blob, filename: string) => Promise<string>;
}

export function attachDictation({ button, input, status, errorBox, transcribe }: DictationParts): void {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { button.hidden = true; return; }
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let startedAt = 0;
  let ticker: number | undefined;
  let limit: number | undefined;

  const setState = (mode: 'idle' | 'recording' | 'busy') => {
    button.dataset.mode = mode;
    // สีแดงตอนอัดใช้ class ของ DaisyUI เอง (CSS ที่เขียนทับ .btn-ghost แพ้ specificity ของ DaisyUI)
    button.classList.toggle('btn-error', mode === 'recording');
    button.classList.toggle('btn-ghost', mode !== 'recording');
    button.setAttribute('aria-pressed', String(mode === 'recording'));
    button.setAttribute('aria-label', mode === 'recording' ? 'หยุดอัดแล้วถอดเสียง' : 'พูดแทนพิมพ์');
    button.disabled = mode === 'busy';
    status.textContent = mode === 'busy' ? 'กำลังถอดเสียง' : '';
    status.hidden = mode === 'idle';
  };
  const showError = (message: string) => { errorBox.textContent = message; errorBox.classList.remove('hidden'); };

  async function start() {
    errorBox.classList.add('hidden');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      showError('เปิดไมค์ไม่ได้ อนุญาตให้เว็บนี้ใช้ไมค์ในการตั้งค่าเบราว์เซอร์ก่อน');
      return;
    }
    const mimeType = pickMimeType((type) => MediaRecorder.isTypeSupported(type));
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunks = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = () => void finish(stream);
    recorder.start();
    startedAt = Date.now();
    setState('recording');
    status.textContent = `กำลังฟัง ${formatElapsed(0)}`;
    ticker = window.setInterval(() => { status.textContent = `กำลังฟัง ${formatElapsed(Date.now() - startedAt)}`; }, 500);
    limit = window.setTimeout(() => recorder?.state === 'recording' && recorder.stop(), MAX_RECORD_MS);
  }

  async function finish(stream: MediaStream) {
    window.clearInterval(ticker); window.clearTimeout(limit);
    stream.getTracks().forEach((track) => track.stop());
    const elapsed = Date.now() - startedAt;
    const type = recorder?.mimeType || chunks[0]?.type || 'audio/webm';
    recorder = null;
    if (elapsed < MIN_RECORD_MS || !chunks.length) { setState('idle'); showError('เสียงสั้นเกินไป พูดให้นานขึ้นอีกนิดแล้วค่อยกดหยุด'); return; }
    setState('busy');
    try {
      const text = await transcribe(new Blob(chunks, { type }), `voice.${fileExtension(type)}`);
      // ช่องพิมพ์ซ่อน error ทุกครั้งที่มี input event จึงต้องเช็คคำว่างก่อนยิง event
      if (!text.trim()) { showError('ไม่ได้ยินคำพูด ลองพูดใกล้ไมค์อีกครั้ง'); return; }
      input.value = appendTranscript(input.value, text);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    } catch (error) {
      showError((error as Error)?.message || 'ถอดเสียงไม่สำเร็จ ลองใหม่อีกครั้ง');
    } finally {
      setState('idle');
    }
  }

  button.addEventListener('click', () => {
    if (button.dataset.mode === 'recording') recorder?.stop();
    else if (button.dataset.mode !== 'busy') void start();
  });
  setState('idle');
}
