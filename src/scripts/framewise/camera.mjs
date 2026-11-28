import { paintGuide } from './guides.mjs';

function toPhoto(video, stage, mirror) {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  if (!sourceWidth || !sourceHeight) return Promise.resolve(null);
  const ratio = stage.clientWidth / stage.clientHeight;
  const cropWidth = Math.min(sourceWidth, sourceHeight * ratio);
  const cropHeight = Math.min(sourceHeight, sourceWidth / ratio);
  const scale = Math.min(1, 2200 / Math.max(cropWidth, cropHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cropWidth * scale));
  canvas.height = Math.max(1, Math.round(cropHeight * scale));
  const ctx = canvas.getContext('2d');
  if (mirror) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(video, (sourceWidth-cropWidth)/2, (sourceHeight-cropHeight)/2, cropWidth,cropHeight,0,0,canvas.width,canvas.height);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .92));
}

export function setupCamera(onScene) {
  const $ = id => document.getElementById(id);
  const dialog = $('camera-dialog'), video = $('live-video'), preview = $('shot-preview');
  const stage = video.parentElement, guide = $('camera-guide'), status = $('camera-status');
  const flip = $('flip-camera'), shutter = $('shutter'), timer = $('timer');
  const retry = $('camera-retry'), retake = $('retake'), download = $('download'), count = $('countdown');
  let stream, shotUrl, interval, pose;
  let facing = 'environment';
  let request = 0;
  let ready = false;
  let busy = false;
  let mirrored = false;

  function setControls() {
    const shot = Boolean(shotUrl);
    flip.hidden = shutter.hidden = shot;
    $('timer-label').hidden = !pose || shot;
    retake.hidden = download.hidden = !shot;
    flip.disabled = shutter.disabled = !ready || busy;
    timer.disabled = busy;
    stage.querySelector('.scene-grid').hidden = shot;
  }

  function clearCountdown() {
    clearInterval(interval);
    interval = undefined;
    count.textContent = '';
  }

  function stopStream() {
    stream?.getTracks().forEach(track => track.stop());
    stream = undefined;
    video.srcObject = null;
    ready = false;
  }

  function clearPreview() {
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    shotUrl = undefined;
    preview.removeAttribute('src');
    download.removeAttribute('href');
    preview.hidden = true;
    video.hidden = false;
    guide.hidden = !pose;
  }

  function reset() {
    request++;
    clearCountdown();
    stopStream();
    clearPreview();
    busy = false;
  }

  async function startCamera(direction = facing, retryDirection) {
    const id = ++request;
    clearCountdown();
    stopStream();
    clearPreview();
    busy = false;
    retry.hidden = true;
    setControls();
    status.textContent = 'Framewise กำลังเปิดกล้อง';
    if (!navigator.mediaDevices?.getUserMedia) {
      status.textContent = 'คุณเปิดกล้องได้จากเบราว์เซอร์ที่รองรับ หรือปิดหน้านี้แล้วเลือกรูปฉาก';
      return;
    }
    try {
      const settings = { video: { facingMode: retryDirection ? { exact: direction } : { ideal: direction }, width: { ideal: 1600 }, height: { ideal: 1600 } }, audio:false };
      const next = await navigator.mediaDevices.getUserMedia(settings);
      if (id !== request || !dialog.open) { next.getTracks().forEach(track => track.stop()); return; }
      stream = next;
      video.srcObject = next;
      await video.play();
      if (id !== request) return;
      facing = stream.getVideoTracks()[0].getSettings().facingMode ?? direction;
      mirrored = facing === 'user';
      stage.dataset.mirror = String(mirrored);
      if (pose) paintGuide(guide, pose.guide, true, mirrored);
      status.textContent = '';
      ready = true;
      setControls();
    } catch (error) {
      if (id !== request || !dialog.open) return;
      stopStream();
      if (retryDirection && error.name === 'OverconstrainedError') {
        await startCamera(retryDirection);
        if (ready && dialog.open) status.textContent = 'เครื่องนี้ไม่มีกล้องอีกด้านให้สลับ';
        return;
      }
      status.textContent = error.name === 'NotAllowedError'
        ? 'คุณอนุญาตกล้องในการตั้งค่าเบราว์เซอร์ได้ หรือปิดหน้านี้แล้วเลือกรูปฉาก'
        : 'Framewise เปิดกล้องไม่ได้ คุณลองอีกครั้งหรือเลือกรูปฉากได้';
      retry.hidden = false;
      setControls();
    }
  }

  async function capture() {
    const id = request;
    try {
      const blob = await toPhoto(video, stage, mirrored);
      if (id !== request || !dialog.open) return;
      if (!blob) throw new Error('Camera image unavailable');
      if (!pose) {
        dialog.close();
        void onScene(blob);
        return;
      }
      shotUrl = URL.createObjectURL(blob);
      preview.src = shotUrl;
      preview.hidden = false;
      download.href = shotUrl;
      video.hidden = true;
      guide.hidden = true;
      stopStream();
      status.textContent = 'คุณบันทึกรูปนี้ลงเครื่องได้';
    } catch {
      if (id === request) status.textContent = 'Framewise ถ่ายรูปนี้ไม่ได้ คุณลองกดถ่ายอีกครั้งได้';
    } finally {
      if (id === request) { busy = false; setControls(); }
    }
  }

  function takePhoto() {
    if (!ready || busy) return;
    busy = true;
    setControls();
    let remaining = pose ? Number(timer.value) : 0;
    if (!remaining) { void capture(); return; }
    count.textContent = String(remaining);
    interval = setInterval(() => {
      if (--remaining > 0) count.textContent = String(remaining);
      else { clearCountdown(); void capture(); }
    }, 1000);
  }

  flip.onclick = () => startCamera(facing === 'environment' ? 'user' : 'environment', facing);
  shutter.onclick = takePhoto;
  retry.onclick = retake.onclick = () => startCamera();
  dialog.addEventListener('close', reset);
  window.addEventListener('pagehide', reset);

  return {
    open(selectedPose = null) {
      pose = selectedPose;
      $('camera-title').textContent = pose?.name ?? 'กล้องดูฉาก';
      $('camera-mode').textContent = pose ? 'คุณจัดตัวแบบให้อยู่ในกรอบท่า' : 'คุณเล็งไปที่สถานที่ที่จะถ่าย';
      $('camera-cue-line').textContent = pose?.camera ?? '';
      $('camera-cue-line').hidden = !pose;
      shutter.lastElementChild.textContent = pose ? 'ถ่ายรูป' : 'วิเคราะห์ฉาก';
      dialog.showModal();
      void startCamera();
    },
  };
}
