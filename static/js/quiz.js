/* ============================================================
   Quiz Module — 7 slider questions
   ============================================================ */

const QUESTIONS = [
  {
    dimension: 'innovation',
    icon: '🚀',
    text: 'Wenn ein neues KI-Tool auf den Markt kommt, probiere ich es sofort selbst aus, noch bevor jemand fragt.',
  },
  {
    dimension: 'struktur',
    icon: '🏗️',
    text: 'Ein sauberer Prozess ist mir wichtiger als ein schneller Workaround.',
  },
  {
    dimension: 'sicherheit',
    icon: '🛡️',
    text: 'Datenschutz und Compliance dürfen niemals der Geschwindigkeit geopfert werden.',
  },
  {
    dimension: 'empathie',
    icon: '🤝',
    text: 'Ich erkläre Kolleginnen und Kollegen geduldig immer wieder dieselbe Software und mache das gerne.',
  },
  {
    dimension: 'automatisierung',
    icon: '⚙️',
    text: 'Wenn ich repetitive Aufgaben sehe, denke ich sofort: Das könnte man automatisieren.',
  },
  {
    dimension: 'daten',
    icon: '📊',
    text: 'Excel-Tabellen mit komplexen Formeln sind für mich kein Problem, sondern Entspannung.',
  },
  {
    dimension: 'change',
    icon: '⚡',
    text: 'Veränderung im Team treibe ich aktiv voran, auch gegen Widerstand.',
  },
];

const QuizModule = {
  current: 0,
  values: new Array(QUESTIONS.length).fill(5),

  start() {
    this.current = 0;
    this.values = new Array(QUESTIONS.length).fill(5);
    this._render();
    this._bindButtons();
  },

  _render() {
    this._renderQuestion(this.current);
    this._updateProgress();
  },

  _renderQuestion(idx) {
    const q = QUESTIONS[idx];

    // Update header
    document.getElementById('q-counter').textContent = `Frage ${idx + 1} von ${QUESTIONS.length}`;

    // Animate out previous card if exists
    const existing = document.querySelector('.question-card.active');
    if (existing) {
      existing.classList.add('exit');
      existing.classList.remove('active');
      setTimeout(() => existing.remove(), 360);
    }

    // Build new card
    const card = document.createElement('div');
    card.className = 'question-card';
    card.dataset.idx = idx;

    const val = this.values[idx];
    const pct = (val / 10) * 100;

    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">
        <div class="question-icon">${q.icon}</div>
        <span class="question-number">Frage ${idx + 1} · ${_dimLabel(q.dimension)}</span>
      </div>
      <p class="question-text">${q.text}</p>
      <div class="slider-section">
        <div class="slider-labels">
          <span class="slider-label">Stimme gar nicht zu</span>
          <span class="slider-label">Stimme voll zu</span>
        </div>
        <div class="slider-wrapper">
          <input
            type="range"
            class="hero-slider"
            min="0" max="10"
            value="${val}"
            style="--pct:${pct}%"
            id="q-slider"
          >
        </div>
        <div class="slider-ticks">
          ${Array.from({length: 11}, (_, i) => `<span>${i}</span>`).join('')}
        </div>
        <div class="current-value-display">
          <div class="current-value-badge" id="q-value">${val}</div>
        </div>
      </div>
    `;

    document.getElementById('question-viewport').appendChild(card);

    // Trigger enter animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => card.classList.add('active'));
    });

    // Bind slider
    const slider = card.querySelector('#q-slider');
    const badge = card.querySelector('#q-value');

    slider.addEventListener('input', () => {
      const v = parseInt(slider.value, 10);
      this.values[idx] = v;
      badge.textContent = v;
      const p = (v / 10) * 100;
      slider.style.setProperty('--pct', `${p}%`);
      badge.style.transform = 'scale(1.15)';
      clearTimeout(badge._t);
      badge._t = setTimeout(() => { badge.style.transform = ''; }, 200);
    });
  },

  _updateProgress() {
    const pct = ((this.current) / QUESTIONS.length) * 100;
    document.getElementById('q-progress').style.width = `${pct}%`;
  },

  _bindButtons() {
    const btnBack = document.getElementById('btn-q-back');
    const btnNext = document.getElementById('btn-q-next');

    const handleBack = () => {
      if (this.current === 0) {
        App.showScreen('screen-welcome');
        return;
      }
      this.current--;
      this._render();
      this._updateNav();
    };

    const handleNext = () => {
      if (this.current < QUESTIONS.length - 1) {
        this.current++;
        this._render();
        this._updateNav();
      } else {
        // Quiz complete — save scores and move to form
        QUESTIONS.forEach((q, i) => {
          App.state.scores[q.dimension] = this.values[i];
        });
        FormModule.init();
        App.showScreen('screen-form');
      }
    };

    // Remove old listeners by replacing nodes
    const newBack = btnBack.cloneNode(true);
    const newNext = btnNext.cloneNode(true);
    btnBack.parentNode.replaceChild(newBack, btnBack);
    btnNext.parentNode.replaceChild(newNext, btnNext);

    newBack.addEventListener('click', handleBack);
    newNext.addEventListener('click', handleNext);

    this._updateNav();
  },

  _updateNav() {
    const back = document.getElementById('btn-q-back');
    const next = document.getElementById('btn-q-next');
    if (!back || !next) return;

    back.textContent = this.current === 0 ? '← Zurück' : '← Zurück';
    next.textContent = this.current === QUESTIONS.length - 1 ? 'Weiter zum Formular →' : 'Weiter →';

    const pct = ((this.current + 1) / QUESTIONS.length) * 100;
    document.getElementById('q-progress').style.width = `${pct}%`;
  },
};

function _dimLabel(dim) {
  const map = {
    innovation: 'Innovation', struktur: 'Struktur', sicherheit: 'Sicherheit',
    empathie: 'Empathie', automatisierung: 'Automatisierung', daten: 'Daten', change: 'Change',
  };
  return map[dim] || dim;
}
