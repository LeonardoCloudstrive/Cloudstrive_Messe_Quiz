/* ============================================================
   Result Module — render hero card, QR code, print
   ============================================================ */

const HERO_ICONS = {
  pioneer:    '🚀',
  architect:  '🏗️',
  compliance: '🛡️',
  coach:      '🤝',
  magician:   '✨',
  detective:  '🔍',
  leader:     '⚡',
  allrounder: '🌟',
};

const ResultModule = {
  render(hero, imageDataUri) {
    // Glow background with hero color
    const glow = document.getElementById('result-bg-glow');
    if (glow) glow.style.background = hero.color || 'var(--primary)';

    // Dimension badge
    const badge = document.getElementById('result-dimension-badge');
    if (badge) {
      badge.textContent = hero.dimension;
      badge.style.background = `${hero.color}22`;
      badge.style.color = hero.color;
      badge.style.borderColor = `${hero.color}44`;
    }

    // Hero name
    const nameEl = document.getElementById('result-name');
    if (nameEl) nameEl.textContent = hero.name;

    // Motto
    const mottoEl = document.getElementById('result-motto');
    if (mottoEl) mottoEl.textContent = `„${hero.motto}"`;

    // Description
    const descEl = document.getElementById('result-description');
    if (descEl) descEl.textContent = hero.description;

    // Hero image
    const imgContainer = document.getElementById('hero-image-container');
    if (imgContainer) {
      if (imageDataUri) {
        imgContainer.innerHTML = `<img src="${imageDataUri}" alt="${hero.name}" />`;
      } else {
        imgContainer.innerHTML = `
          <div class="hero-image-placeholder">
            <span style="font-size:5rem">${HERO_ICONS[hero.type] || '⭐'}</span>
            <span style="font-family:var(--font-heading);font-size:1.1rem;color:rgba(255,255,255,0.4);padding:0 24px;text-align:center">${hero.name}</span>
          </div>`;
      }
    }

    // Wire up action buttons
    document.getElementById('btn-print')?.addEventListener('click', () => {
      this._preparePrint(hero, imageDataUri);
      window.print();
    });

    document.getElementById('btn-restart')?.addEventListener('click', () => App.reset());
  },

  _preparePrint(hero, imageDataUri) {
    // Apply hero color to print card
    const printCard = document.getElementById('print-postcard');
    if (printCard) printCard.style.setProperty('--hero-color', hero.color || '#1E5AFF');

    const printImg  = document.getElementById('print-hero-image');
    const printDim  = document.getElementById('print-hero-dimension');
    const printName = document.getElementById('print-hero-name');
    const printMotto = document.getElementById('print-hero-motto');

    if (printImg) {
      if (imageDataUri) {
        printImg.src = imageDataUri;
        printImg.style.display = 'block';
      } else {
        printImg.style.display = 'none';
        const frame = printImg.closest('.print-hero-frame');
        if (frame) {
          frame.style.background = hero.bg_color || '#EBF1FF';
          frame.style.display = 'flex';
          frame.style.alignItems = 'center';
          frame.style.justifyContent = 'center';
          frame.style.fontSize = '5rem';
        }
      }
    }

    if (printDim)  printDim.textContent  = hero.dimension;
    if (printName) printName.textContent  = hero.name;
    if (printMotto) printMotto.textContent = `„${hero.motto}"`;

    this._renderQR('print-qr-container', 'https://cloudstrive.ai');
  },

  _renderQR(containerId, url) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (typeof QRCode !== 'undefined') {
      new QRCode(container, {
        text: url,
        width: 68,
        height: 68,
        colorDark: '#0A1628',
        colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.M,
      });
    } else {
      // Fallback: tiny text link
      container.innerHTML = `<div style="font-size:6pt;word-break:break-all;color:#1E5AFF">cloudstrive.ai</div>`;
    }
  },
};

/* ============================================================
   Form Module
   ============================================================ */
const FormModule = {
  init() {
    this._bindGender();
    this._bindSubmit();
    // Reset form
    ['f-name', 'f-email', 'f-telephone', 'f-department'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const gdpr = document.getElementById('f-gdpr');
    if (gdpr) gdpr.checked = false;
    this._setGender('neutral');
  },

  _setGender(val) {
    App.state.lead.gender = val;
    document.querySelectorAll('.gender-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.gender === val);
    });
  },

  _bindGender() {
    document.querySelectorAll('.gender-btn').forEach(btn => {
      btn.addEventListener('click', () => this._setGender(btn.dataset.gender));
    });
  },

  _bindSubmit() {
    const btn = document.getElementById('btn-form-next');
    if (!btn) return;

    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);

    fresh.addEventListener('click', () => {
      const name      = document.getElementById('f-name')?.value.trim();
      const email     = document.getElementById('f-email')?.value.trim();
      const telephone = document.getElementById('f-telephone')?.value.trim();
      const gdpr      = document.getElementById('f-gdpr')?.checked;

      if (!name)                           { showToast('Bitte geben Sie Ihren Namen ein.'); return; }
      if (!email || !email.includes('@'))  { showToast('Bitte geben Sie eine gültige E-Mail-Adresse ein.'); return; }
      if (!telephone)                      { showToast('Bitte geben Sie Ihre Telefonnummer ein.'); return; }
      if (!gdpr)                           { showToast('Bitte stimmen Sie der Datenschutzerklärung zu.'); return; }

      App.state.lead = {
        ...App.state.lead,
        name,
        email,
        telephone,
        department: document.getElementById('f-department')?.value.trim() || '',
        gdpr_consent: gdpr,
      };

      CameraModule.init();
      App.showScreen('screen-camera');
    });
  },
};
