/* ============================================================
   Camera Module — capture photo, then immediately submit
   ============================================================ */

const CameraModule = {
  _stream: null,

  async init() {
    this._showLive();

    const video  = document.getElementById('camera-video');
    const canvas = document.getElementById('canvas-hidden');

    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width:  { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ zoom: 1 }],   // request minimum zoom where supported
        },
        audio: false,
      });
      video.srcObject = this._stream;
    } catch (err) {
      console.error('Camera access denied:', err);
      this._showNoCameraFallback();
      return;
    }

    // Replace nodes to avoid stacking listeners on repeated init() calls
    const replaceListener = (id, handler) => {
      const el = document.getElementById(id);
      if (!el) return;
      const clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
      clone.addEventListener('click', handler);
    };

    replaceListener('btn-capture',   () => this._capture(video, canvas));
    replaceListener('btn-skip-photo', () => this._skip());
  },

  _capture(video, canvas) {
    // Guard: getUserMedia may not have resolved yet
    if (!video.videoWidth) {
      showToast('Kamera noch nicht bereit – bitte kurz warten.');
      return;
    }

    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const offsetX = (video.videoWidth  - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

    App.state.photo = canvas.toDataURL('image/jpeg', 0.85);
    this.stop();
    App.submitAndGenerate();
  },

  _skip() {
    App.state.photo = null;
    this.stop();
    App.submitAndGenerate();
  },

  _showLive() {
    const live    = document.getElementById('camera-live-area');
    const capture = document.getElementById('camera-capture-controls');
    if (live)    { live.style.display    = '';     live.classList.remove('hidden'); }
    if (capture) { capture.style.display = '';     capture.classList.remove('hidden'); }
  },

  _showNoCameraFallback() {
    const live    = document.getElementById('camera-live-area');
    const capture = document.getElementById('camera-capture-controls');
    const noCamera = document.getElementById('no-camera-fallback');

    if (live)    live.classList.add('hidden');
    if (capture) capture.classList.add('hidden');
    if (noCamera) {
      noCamera.style.display = 'flex';
      noCamera.classList.remove('hidden');
    }

    const skipFallback = document.getElementById('btn-skip-fallback');
    if (skipFallback) {
      const clone = skipFallback.cloneNode(true);
      skipFallback.parentNode.replaceChild(clone, skipFallback);
      clone.addEventListener('click', () => {
        App.state.photo = null;
        App.submitAndGenerate();
      });
    }
  },

  stop() {
    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }
    const video = document.getElementById('camera-video');
    if (video) video.srcObject = null;
  },
};
