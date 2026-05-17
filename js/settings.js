export const DEFAULT_LIFE_EXPECTANCY = 80;

export function loadSettings() {
  const params = new URLSearchParams(window.location.search);
  const urlBirthdate = params.get('birthdate');
  const urlLife = params.get('life');

  const lsBirthdate = localStorage.getItem('birthdate');
  const lsLife = localStorage.getItem('lifeExpectancy');

  const birthdate = urlBirthdate || lsBirthdate || null;
  const lifeExpectancy = urlLife
    ? parseInt(urlLife, 10)
    : lsLife
    ? parseInt(lsLife, 10)
    : DEFAULT_LIFE_EXPECTANCY;

  return { birthdate, lifeExpectancy };
}

export function saveSettings({ birthdate, lifeExpectancy }) {
  if (birthdate !== undefined) localStorage.setItem('birthdate', birthdate);
  if (lifeExpectancy !== undefined)
    localStorage.setItem('lifeExpectancy', String(lifeExpectancy));

  const current = loadSettings();
  const merged = {
    birthdate: birthdate ?? current.birthdate,
    lifeExpectancy: lifeExpectancy ?? current.lifeExpectancy,
  };

  const params = new URLSearchParams();
  if (merged.birthdate) params.set('birthdate', merged.birthdate);
  params.set('life', String(merged.lifeExpectancy));
  history.replaceState(null, '', `?${params.toString()}`);
}

export function clearSettings() {
  localStorage.removeItem('birthdate');
  localStorage.removeItem('lifeExpectancy');
  localStorage.removeItem('backgroundUrl');
  localStorage.removeItem('theme');
  history.replaceState(null, '', window.location.pathname);
}
