import { saveSettings, clearSettings, DEFAULT_LIFE_EXPECTANCY } from './settings.js';
import { formatDDMMYYYY } from './dates.js';

export function initOnboarding(onComplete) {
  const onboarding = document.getElementById('onboarding');
  const step1 = document.getElementById('ob-step1');
  const step2 = document.getElementById('ob-step2');
  const dot1 = document.getElementById('ob-dot1');
  const dot2 = document.getElementById('ob-dot2');
  const bdInput = document.getElementById('ob-birthdate');
  const nextBtn = document.getElementById('ob-next');
  const lifeInput = document.getElementById('ob-life-input');
  const lifeSlider = document.getElementById('ob-life-slider');
  const startBtn = document.getElementById('ob-start');

  lifeInput.value = DEFAULT_LIFE_EXPECTANCY;
  lifeSlider.value = DEFAULT_LIFE_EXPECTANCY;

  lifeInput.addEventListener('input', () => {
    lifeSlider.value = lifeInput.value;
  });
  lifeSlider.addEventListener('input', () => {
    lifeInput.value = lifeSlider.value;
  });

  const goStep2 = () => {
    if (!bdInput.value) {
      bdInput.focus();
      return;
    }
    step1.classList.add('ob-step--out');
    step2.classList.remove('ob-step--hidden');
    step2.classList.add('ob-step--in');
    dot1.classList.remove('ob-dot--active');
    dot2.classList.add('ob-dot--active');
  };

  nextBtn.addEventListener('click', goStep2);
  bdInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') goStep2(); });

  startBtn.addEventListener('click', () => {
    const birthdate = bdInput.value;
    const lifeExpectancy = parseInt(lifeInput.value, 10) || DEFAULT_LIFE_EXPECTANCY;
    if (!birthdate) return;
    saveSettings({ birthdate, lifeExpectancy });
    onboarding.classList.add('hidden');
    onComplete({ birthdate, lifeExpectancy });
  });
  lifeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startBtn.click();
  });
}

export function showOnboarding() {
  document.getElementById('onboarding').classList.remove('hidden');
}

export function initSettingsPanel(currentSettings, onChange) {
  const gearBtn = document.getElementById('gear-btn');
  const panel = document.getElementById('settings-panel');
  const overlay = document.getElementById('settings-overlay');
  const closeBtn = document.getElementById('sp-close');
  const bdInput = document.getElementById('sp-birthdate');
  const lifeInput = document.getElementById('sp-life-input');
  const lifeSlider = document.getElementById('sp-life-slider');
  const resetLink = document.getElementById('sp-reset');

  bdInput.value = currentSettings.birthdate || '';
  lifeInput.value = currentSettings.lifeExpectancy;
  lifeSlider.value = currentSettings.lifeExpectancy;

  const openPanel = () => {
    panel.classList.add('sp--open');
    overlay.classList.remove('hidden');
  };
  const closePanel = () => {
    panel.classList.remove('sp--open');
    overlay.classList.add('hidden');
  };

  gearBtn.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);

  const applyChanges = () => {
    const birthdate = bdInput.value;
    const lifeExpectancy = parseInt(lifeInput.value, 10) || DEFAULT_LIFE_EXPECTANCY;
    if (!birthdate) return;
    saveSettings({ birthdate, lifeExpectancy });
    onChange({ birthdate, lifeExpectancy });
  };

  lifeInput.addEventListener('input', () => { lifeSlider.value = lifeInput.value; });
  lifeSlider.addEventListener('input', () => { lifeInput.value = lifeSlider.value; });

  bdInput.addEventListener('change', applyChanges);
  lifeInput.addEventListener('change', applyChanges);
  lifeSlider.addEventListener('change', applyChanges);

  resetLink.addEventListener('click', (e) => {
    e.preventDefault();
    clearSettings();
    window.location.reload();
  });
}

export function updateStats(weeksLived, totalWeeks) {
  const el = document.getElementById('stats');
  if (!el) return;
  const remaining = totalWeeks - weeksLived;
  el.textContent = `${weeksLived.toLocaleString()} weeks lived · ${remaining.toLocaleString()} to go`;
}

export function updateFooterDate(birthdate) {
  const el = document.getElementById('footer-date');
  if (!el || !birthdate) return;
  el.textContent = formatDDMMYYYY(new Date(birthdate + 'T00:00:00'));
}
