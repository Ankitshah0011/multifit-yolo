// Camera module
const Camera = (() => {
  let stream = null;
  let currentMode = 'user';

  async function start(videoEl, mode) {
    currentMode = mode || 'user';
    const constraints = {
      video: { facingMode: currentMode, width: { ideal: 720 }, height: { ideal: 960 } },
      audio: false,
    };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = stream;
    return new Promise((resolve) => {
      videoEl.onloadedmetadata = () => {
        videoEl.play();
        resolve();
      };
    });
  }

  function capture(videoEl, canvasEl) {
    const ctx = canvasEl.getContext('2d');
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    if (currentMode === 'user') {
      // Mirror for selfie camera
      ctx.translate(canvasEl.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoEl, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return canvasEl;
  }

  function stop() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  }

  return { start, capture, stop };
})();
