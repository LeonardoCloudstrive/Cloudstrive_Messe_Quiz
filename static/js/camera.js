/* ============================================================
   Camera Module — capture photo with DSGVO notice
   ============================================================ */

const CameraModule = {
  _stream: null,
  _captured: false,

  async init() {
    this._captured = false;
    this._showLive();

    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('canvas-hidden');

    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      video.srcObject = this._stream;
    } catch (err) {
      console.error('Camera access denied:', err);
      // Skip camera — allow proceeding without photo
      this._showNoCameraFallback();
      return;
    }

    const btnCapture = document.getElementById('btn-capture');
    const btnRetake  = document.getElementById('btn-retake');
    const btnConfirm = document.getElementById('btn-confirm-photo');
    const btnSkip    = document.getElementById('btn-skip-photo');

    btnCapture?.addEventListener('click', () => this._capture(video, canvas));
    btnRetake?.addEventListener('click', () => this._retake(video));
    btnConfirm?.addEventListener('click', () => this._confirm());
    btnSkip?.addEventListener('click', () => this._skip());
  },

  _capture(video, canvas) {
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Crop center square
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    App.state.photo = dataUrl;

    // Show preview
    const preview = document.getElementById('camera-preview');
    if (preview) {
      preview.src = dataUrl;
      this._showPreview();
    }
    this._captured = true;
  },

  _retake(video) {
    App.state.photo = null;
    this._captured = false;
    this._showLive();
  },

  _confirm() {
    this.stop();
    App.submitAndGenerate();
  },

  _skip() {
    App.state.photo = null;
    this.stop();
    App.submitAndGenerate();
  },

  _showLive() {
    document.getElementById('camera-live-area')?.classList.remove('hidden');
    document.getElementById('camera-preview-area')?.classList.add('hidden');
    document.getElementById('camera-capture-controls')?.classList.remove('hidden');
    document.getElementById('camera-confirm-controls')?.classList.add('hidden');
  },

  _showPreview() {
    document.getElementById('camera-live-area')?.classList.add('hidden');
    document.getElementById('camera-preview-area')?.classList.remove('hidden');
    document.getElementById('camera-capture-controls')?.classList.add('hidden');
    document.getElementById('camera-confirm-controls')?.classList.remove('hidden');
  },

  _showNoCameraFallback() {
    const noCamera = document.getElementById('no-camera-fallback');
    const live = document.getElementById('camera-live-area');
    const capCtrl = document.getElementById('camera-capture-controls');

    if (live) live.classList.add('hidden');
    if (capCtrl) capCtrl.classList.add('hidden');
    if (noCamera) noCamera.classList.remove('hidden');

    document.getElementById('btn-skip-fallback')?.addEventListener('click', () => {
      App.state.photo = null;
      App.submitAndGenerate();
    });
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
