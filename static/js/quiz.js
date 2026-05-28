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
    this._initProgressSegments();
    this._render();
    this._bindButtons();
  },

  _render() {
    this._renderQuestion(this.current);
    this._updateProgress();
  },

  _renderQuestion(idx) {
    const q = QUESTIONS[idx];

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
      <span class="question-number">${_dimLabel(q.dimension)}</span>
      <p class="question-text">${q.text}</p>
      <div class="slider-section">
        <div class="slider-labels">
          <span class="slider-label">Stimme gar nicht zu</span>
          <span class="slider-label">Stimme voll zu</span>
        </div>
        <div class="slider-wrapper">
          <div class="slider-tooltip" id="q-tooltip">${val}</div>
          <input
            type="range"
            class="hero-slider"
            min="0" max="10"
            value="${val}"
            style="--pct:${pct}%"
            id="q-slider"
          >
        </div>
      </div>
    `;

    document.getElementById('question-viewport').appendChild(card);

    // Bind slider + tooltip
    const slider  = card.querySelector('#q-slider');
    const tooltip = card.querySelector('#q-tooltip');

    const positionTooltip = () => {
      const v      = parseInt(slider.value, 10);
      const thumbW = 44;
      const trackW = slider.offsetWidth;
      tooltip.style.left = `${(v / 10) * (trackW - thumbW) + thumbW / 2}px`;
      tooltip.textContent = v;
    };

    slider.addEventListener('input', () => {
      const v = parseInt(slider.value, 10);
      this.values[idx] = v;
      slider.style.setProperty('--pct', `${(v / 10) * 100}%`);
      positionTooltip();
    });

    // Trigger enter animation and set initial tooltip position
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.classList.add('active');
        positionTooltip();
      });
    });
  },

  _initProgressSegments() {
    const container = document.getElementById('progress-segments');
    if (!container) return;
    container.innerHTML = '';
    QUESTIONS.forEach((_, i) => {
      const seg = document.createElement('div');
      seg.className = 'progress-segment';
      seg.id = `prog-seg-${i}`;
      container.appendChild(seg);
    });
  },

  _updateProgress() {
    document.getElementById('q-counter').textContent = `${this.current + 1} / ${QUESTIONS.length}`;
    QUESTIONS.forEach((_, i) => {
      const seg = document.getElementById(`prog-seg-${i}`);
      if (!seg) return;
      seg.className = 'progress-segment';
      if (i < this.current) seg.classList.add('done');
      else if (i === this.current) seg.classList.add('active');
    });
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
    next.textContent = this.current === QUESTIONS.length - 1 ? 'Weiter zum Formular →' : 'Weiter →';
    this._updateProgress();
  },
};

function _dimLabel(dim) {
  const map = {
    innovation: 'Innovation', struktur: 'Struktur', sicherheit: 'Sicherheit',
    empathie: 'Empathie', automatisierung: 'Automatisierung', daten: 'Daten', change: 'Change',
  };
  return map[dim] || dim;
}
