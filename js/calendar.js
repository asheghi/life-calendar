import { addYears, daysBetween } from './dates.js';

function weeksPerYear(birthDate, lifeYears) {
  const counts = [];
  for (let n = 0; n < lifeYears; n++) {
    const yearStart = addYears(birthDate, n);
    const yearEnd = addYears(birthDate, n + 1);
    const firstWeek = Math.ceil(daysBetween(birthDate, yearStart) / 7);
    const lastWeek = Math.ceil(daysBetween(birthDate, yearEnd) / 7) - 1;
    counts.push(lastWeek - firstWeek + 1);
  }
  return counts;
}

export function renderCalendar(plot, birthDate, lifeYears) {
  plot.innerHTML = '';

  const weeksLived = Math.floor(daysBetween(birthDate, new Date()) / 7);
  const counts = weeksPerYear(birthDate, lifeYears);

  // week-number header row
  const headerRow = document.createElement('div');
  headerRow.className = 'row row--header';
  for (let w = 1; w <= 52; w++) {
    const lbl = document.createElement('span');
    lbl.className = 'week--label';
    if (w % 4 === 0) {
      lbl.textContent = String(w).padStart(2, '0');
      lbl.classList.add('week--label-visible');
    }
    headerRow.appendChild(lbl);
  }
  plot.appendChild(headerRow);

  let weekIndex = 0;
  counts.forEach((count, yearIdx) => {
    const row = document.createElement('div');
    row.className = 'row';

    const yearLbl = document.createElement('div');
    yearLbl.className = 'year';
    yearLbl.textContent = String(yearIdx).padStart(2, '0');
    row.appendChild(yearLbl);

    for (let i = 0; i < count; i++) {
      const cell = document.createElement('span');
      cell.className = 'week';

      if (weekIndex < weeksLived) {
        cell.classList.add('week--passed');
      } else if (weekIndex === weeksLived) {
        cell.classList.add('week--current');
      }

      if (i >= 52) {
        cell.classList.add('week--overflow');
      }

      row.appendChild(cell);
      weekIndex++;
    }

    plot.appendChild(row);
  });

  return { weeksLived, totalWeeks: weekIndex };
}
