function normalizeDate(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function calculateReadingStreak(readShelf = []) {
  const finishedDates = readShelf
    .map((book) => book.finishedAt || book.updatedAt || book.addedAt)
    .filter(Boolean)
    .map(normalizeDate)
    .sort((a, b) => b - a);

  if (finishedDates.length === 0) return 0;

  const uniqueDays = [];
  const seen = new Set();

  for (const day of finishedDates) {
    const key = day.toISOString();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueDays.push(day);
    }
  }

  const today = normalizeDate(new Date());
  const yesterday = normalizeDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const firstDay = uniqueDays[0].getTime();

  if (firstDay !== today.getTime() && firstDay !== yesterday.getTime()) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i += 1) {
    const previous = uniqueDays[i - 1].getTime();
    const current = uniqueDays[i].getTime();
    const diffDays = Math.round((previous - current) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      break;
    }
  }

  return streak;
}

function buildReadingStats(library) {
  const read = library?.read || [];
  const currentlyReading = library?.currentlyReading || [];
  const wantToRead = library?.wantToRead || [];

  return {
    totalBooksRead: read.length,
    currentlyReading: currentlyReading.length,
    wantToRead: wantToRead.length,
    readingStreak: calculateReadingStreak(read),
    lastUpdatedAt: new Date(),
  };
}

module.exports = {
  buildReadingStats,
};
