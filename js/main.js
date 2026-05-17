import { loadSettings } from './settings.js';
import { renderCalendar } from './calendar.js';
import { initOnboarding, initSettingsPanel, updateStats, updateFooterDate } from './ui.js';

const plot = document.querySelector('.plot');

// ── Print ────────────────────────────────────────────────
// zoom (unlike transform) collapses layout height so the browser page-break
// engine sees a single page. Target = A4 portrait minus Chrome default margins.
const PRINT_W = 720;  // 191mm × 96/25.4
const PRINT_H = 1000; // 278mm × 96/25.4  (conservative)

window.addEventListener('beforeprint', () => {
  const container = document.querySelector('.container');
  document.body.style.minHeight = '';
  // Collapse container to its content width before measuring,
  // otherwise it stretches to viewport width and drives zoom too small.
  container.style.width = 'fit-content';
  container.style.margin = '0 auto';
  container.offsetHeight; // force reflow so measurements are accurate
  const z = Math.min(PRINT_W / container.scrollWidth, PRINT_H / container.scrollHeight, 1);
  container.style.zoom = String(z);
});

window.addEventListener('afterprint', () => {
  const container = document.querySelector('.container');
  container.style.width = '';
  container.style.margin = '';
  container.style.zoom = '';
  applyScale();
});

// ── Theme ────────────────────────────────────────────────
const THEMES = ['light', 'dark', 'aurora', 'sunset', 'ocean'];

function setTheme(name) {
  document.documentElement.setAttribute('data-theme', name);
  localStorage.setItem('theme', name);
  document.querySelectorAll('.swatch').forEach(s =>
    s.classList.toggle('swatch--active', s.dataset.themeValue === name)
  );
}

// mark the active swatch on load
setTheme(document.documentElement.getAttribute('data-theme') || 'light');

document.getElementById('theme-btn').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]);
});

document.querySelectorAll('.swatch').forEach(s =>
  s.addEventListener('click', () => setTheme(s.dataset.themeValue))
);

const scaleWrapper = document.querySelector('.scale-wrapper');
const applyScale = () => {
  const scale = parseFloat(Math.min(1, window.innerWidth / 1920 + 0.15).toFixed(2));
  scaleWrapper.style.transform = `scale(${scale})`;
  scaleWrapper.style.marginBottom = `-${scaleWrapper.scrollHeight * (1 - scale)}px`;
  document.body.style.minHeight = `${scaleWrapper.scrollHeight * scale}px`;
};
applyScale();
window.addEventListener('resize', applyScale);

function draw(settings) {
  const bd = new Date(settings.birthdate + 'T00:00:00');
  const { weeksLived, totalWeeks } = renderCalendar(plot, bd, settings.lifeExpectancy);
  updateStats(weeksLived, totalWeeks);
  updateFooterDate(settings.birthdate);
  applyScale();
}

const settings = loadSettings();

if (!settings.birthdate) {
  initOnboarding((confirmed) => {
    draw(confirmed);
    initSettingsPanel(confirmed, (updated) => draw(updated));
  });
} else {
  document.getElementById('onboarding').classList.add('hidden');
  draw(settings);
  initSettingsPanel(settings, (updated) => draw(updated));
}
