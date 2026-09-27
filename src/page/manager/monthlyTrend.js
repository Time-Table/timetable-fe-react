const monthNumber = (value) => Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7)) - 1;

const monthLabel = (number) =>
  `${Math.floor(number / 12)}-${String((number % 12) + 1).padStart(2, "0")}`;

const seoulMonth = (date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}`;
};

export const monthlyCreationSeries = (visits, months, now = new Date()) => {
  if (!visits?.length) return [];

  const current = monthNumber(seoulMonth(now));
  const counts = new Map();
  for (const row of visits) {
    if (!/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(row?.date || "")) continue;
    const month = monthNumber(row.date);
    if (month > current) continue;
    const count = Number(row.todayTableCreateCount || 0);
    if (!Number.isFinite(count) || count < 0) continue;
    counts.set(month, (counts.get(month) || 0) + count);
  }

  const first = months === 0 ? Math.min(...counts.keys()) : current - months + 1;
  if (!Number.isFinite(first)) return [];
  return Array.from({ length: current - first + 1 }, (_, offset) => {
    const month = first + offset;
    return { month: monthLabel(month), count: counts.get(month) || 0 };
  });
};
