/* ============================================================
   App — Global state, screen navigation, API
   ============================================================ */

const App = {
  state: {
    scores: {
      innovation: 5,
      struktur: 5,
      sicherheit: 5,
      empathie: 5,
      automatisierung: 5,
      daten: 5,
      change: 5,
    },
    photo: null,          // data-URI string
    lead: {},
    hero: null,
    image: null,
    sessionId: null,
  },

  currentScreen: 'screen-welcome',

  init() {
    this._bindGlobalNav();
    this.showScreen('screen-welcome');
  },

  showScreen(id) {
    const prev = document.querySelector('.screen.active');
    const next = document.getElementById(id);

    if (!next) return;
    if (prev) prev.classList.remove('active');

    next.classList.add('active');
    next.scrollTop = 0;
    this.currentScreen = id;
  },

  _bindGlobalNav() {
    document.getElementById('btn-start')?.addEventListener('click', () => {
      QuizModule.start();
      this.showScreen('screen-quiz');
    });
  },

  async submitAndGenerate() {
    this.showScreen('screen-loading');
    LoadingModule.start();

    try {
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores: this.state.scores,
          photo: this.state.photo,
          lead: this.state.lead,
        }),
      });

      if (!resp.ok) throw new Error(`Server error ${resp.status}`);
      const data = await resp.json();

      this.state.hero = data.hero;
      this.state.image = data.image;
      this.state.sessionId = data.session_id;

      LoadingModule.finish(() => {
        ResultModule.render(data.hero, data.image);
        this.showScreen('screen-result');
      });
    } catch (err) {
      console.error('Generation failed:', err);
      LoadingModule.finish(() => {
        // Render result without AI image (fallback)
        const fallbackHero = this._localFallbackHero();
        this.state.hero = fallbackHero;
        ResultModule.render(fallbackHero, null);
        this.showScreen('screen-result');
        showToast('Bild konnte nicht generiert werden – Ihre Daten wurden gespeichert.');
      });
    }
  },

  reset() {
    this.state = {
      scores: { innovation: 5, struktur: 5, sicherheit: 5, empathie: 5, automatisierung: 5, daten: 5, change: 5 },
      photo: null,
      lead: {},
      hero: null,
      image: null,
      sessionId: null,
    };
    CameraModule.stop();
    QuizModule.start();
    this.showScreen('screen-welcome');
  },

  /* Client-side hero assignment as fallback when server is unreachable */
  _localFallbackHero() {
    const s = this.state.scores;
    const vals = Object.values(s);
    const maxVal = Math.max(...vals);

    const HEROES = {
      compliance:  { type: 'compliance',  dimension: 'Sicherheit',     color: '#1D4ED8', bg_color: '#EEF2FF', motto: 'Compliance ist meine Superkraft.' },
      pioneer:     { type: 'pioneer',     dimension: 'Innovation',     color: '#1E5AFF', bg_color: '#EBF1FF', motto: 'Ich war schon da, bevor es einen Hype gab.' },
      magician:    { type: 'magician',    dimension: 'Automatisierung', color: '#7C3AED', bg_color: '#F5F3FF', motto: 'Drei Klicks? Mach ich einen draus.' },
      architect:   { type: 'architect',   dimension: 'Struktur',       color: '#2563EB', bg_color: '#EFF6FF', motto: 'Erst der Prozess, dann der Klick.' },
      detective:   { type: 'detective',   dimension: 'Daten',          color: '#0891B2', bg_color: '#ECFEFF', motto: 'Die Wahrheit liegt in den Daten.' },
      leader:      { type: 'leader',      dimension: 'Change',         color: '#DC2626', bg_color: '#FEF2F2', motto: 'Wandel ist mein Heimspiel.' },
      coach:       { type: 'coach',       dimension: 'Empathie',       color: '#EA580C', bg_color: '#FFF7ED', motto: 'Ich nehme alle mit, auch die Skeptiker.' },
      allrounder:  { type: 'allrounder',  dimension: 'Vielseitigkeit', color: '#059669', bg_color: '#ECFDF5', motto: 'Ich kann alles. Ein bisschen.' },
    };

    const NAMES = {
      compliance: { weiblich: 'Die Compliance-Wächterin', maennlich: 'Der Compliance-Wächter',   neutral: 'Compliance-Wächter:in' },
      pioneer:    { weiblich: 'Die KI-Pionierin',          maennlich: 'Der KI-Pionier',            neutral: 'KI-Pionier:in' },
      magician:   { weiblich: 'Die Automatisierungs-Magierin', maennlich: 'Der Automatisierungs-Magier', neutral: 'Automatisierungs-Magier:in' },
      architect:  { weiblich: 'Die Prozess-Architektin',   maennlich: 'Der Prozess-Architekt',    neutral: 'Prozess-Architekt:in' },
      detective:  { weiblich: 'Die Daten-Detektivin',      maennlich: 'Der Daten-Detektiv',       neutral: 'Daten-Detektiv:in' },
      leader:     { weiblich: 'Die Transformations-Leaderin', maennlich: 'Der Transformations-Leader', neutral: 'Transformations-Leader:in' },
      coach:      { weiblich: 'Die Change-Coachin',        maennlich: 'Der Change-Coach',         neutral: 'Change-Coach:in' },
      allrounder: { weiblich: 'Die Allrounder-Heldin',     maennlich: 'Der Allrounder-Held',      neutral: 'Allrounder-Held:in' },
    };

    const DESCRIPTIONS = {
      compliance: 'Hütet DSGVO, NIS2 und Vergaberecht. Nichts kommt unbemerkt vorbei.',
      pioneer:    'Stürmt voran, testet jedes neue Modell, Speerspitze der Digitalisierung.',
      magician:   'Verwandelt Klickstrecken in 1-Klick-Lösungen, Low-Code-Fan.',
      architect:  'Baut elegante Workflows, denkt in Systemen, liebt saubere Abläufe.',
      detective:  'Findet im Zahlenmeer das entscheidende Muster, Excel-Held:in.',
      leader:     'Treibt den Wandel im Institut voran, vereint Vision und Umsetzung.',
      coach:      'Nimmt das Team mit auf die Reise, übersetzt Technik in Mensch.',
      allrounder: 'Ausbalanciertes Profil, das Schweizer Taschenmesser der Verwaltung.',
    };

    let type = 'allrounder';
    if (s.sicherheit >= 8 && s.sicherheit === maxVal) type = 'compliance';
    else if (s.innovation >= 8 && s.automatisierung >= 6) type = 'pioneer';
    else if (s.automatisierung >= 8 && s.daten >= 6) type = 'magician';
    else if (s.struktur >= 8 && s.automatisierung >= 6) type = 'architect';
    else if (s.daten >= 8) type = 'detective';
    else if (s.change >= 8 && s.innovation >= 6) type = 'leader';
    else if (s.empathie >= 7 && s.change >= 7) type = 'coach';

    const gender = this.state.lead.gender || 'neutral';
    const base = HEROES[type];
    return {
      ...base,
      name: NAMES[type][gender] || NAMES[type].neutral,
      description: DESCRIPTIONS[type],
    };
  },
};

/* ============================================================
   Toast
   ============================================================ */
function showToast(msg) {
  let el = document.getElementById('error-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'error-toast';
    el.className = 'error-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

/* ============================================================
   Loading Module
   ============================================================ */
const LoadingModule = {
  _timer: null,
  _steps: [
    { id: 'step-analyzing',  label: 'Persönlichkeit wird analysiert …' },
    { id: 'step-selecting',  label: 'Helden-Typ wird ermittelt …' },
    { id: 'step-painting',   label: 'Heldenbild wird gemalt …' },
    { id: 'step-finishing',  label: 'Finishing touches …' },
  ],

  start() {
    this._steps.forEach((s, i) => {
      const el = document.getElementById(s.id);
      if (el) { el.classList.remove('done', 'active'); }
    });
    this._activateStep(0);
  },

  _activateStep(idx) {
    const step = this._steps[idx];
    if (!step) return;

    for (let i = 0; i < idx; i++) {
      const el = document.getElementById(this._steps[i].id);
      if (el) { el.classList.remove('active'); el.classList.add('done'); }
    }

    const el = document.getElementById(step.id);
    if (el) el.classList.add('active');

    if (idx < this._steps.length - 1) {
      this._timer = setTimeout(() => this._activateStep(idx + 1), 4500);
    }
  },

  finish(cb) {
    clearTimeout(this._timer);
    this._steps.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) { el.classList.add('done'); el.classList.remove('active'); }
    });
    setTimeout(cb, 600);
  },
};

/* ============================================================
   Theme Toggle
   ============================================================ */
const ThemeToggle = {
  init() {
    const btn = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');
    const html = document.documentElement;

    // Restore saved preference
    if (localStorage.getItem('cs-theme') === 'light') {
      html.classList.add('light');
      if (icon) icon.textContent = '🌙';
    }

    btn?.addEventListener('click', () => {
      const isLight = html.classList.toggle('light');
      localStorage.setItem('cs-theme', isLight ? 'light' : 'dark');
      if (icon) icon.textContent = isLight ? '🌙' : '☀️';
    });
  },
};

/* Boot */
document.addEventListener('DOMContentLoaded', () => {
  ThemeToggle.init();
  App.init();
});
