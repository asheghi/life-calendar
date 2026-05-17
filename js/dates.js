export const addYears = (d, n) => {
  const r = new Date(d);
  r.setFullYear(r.getFullYear() + n);
  return r;
};

export const daysBetween = (a, b) => Math.round((b - a) / 86_400_000);

export const weeksSince = (d) => Math.floor(daysBetween(d, new Date()) / 7);

const pad = (n) => String(n).padStart(2, '0');
export const formatDDMMYYYY = (d) =>
  `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
