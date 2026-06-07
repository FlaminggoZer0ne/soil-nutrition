/**
 * Helper functions for date and week calculations.
 */

/**
 * Calculates the ISO-8601 week number for a given date string (YYYY-MM-DD).
 */
function getWeekNumber(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  
  // Set to UTC midnight to avoid timezone issues
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

/**
 * Gets the month (1-12) for a given date string.
 */
function getMonthFromDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  return d.getMonth() + 1;
}

/**
 * Gets the year for a given date string.
 */
function getYearFromDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  return d.getFullYear();
}

/**
 * Calculates the age in months between planting date and sampling date.
 */
function getAgeInMonths(tanggalKirim, tanggalTanam) {
  if (!tanggalKirim || !tanggalTanam) return null;
  const start = new Date(tanggalTanam);
  const end = new Date(tanggalKirim);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  
  const yearsDiff = end.getFullYear() - start.getFullYear();
  const monthsDiff = end.getMonth() - start.getMonth();
  
  return (yearsDiff * 12) + monthsDiff;
}

/**
 * Infer PG from block code prefix:
 * prefix '0xx' = PG1, '4xx' = PG4, '5xx' = PG3
 */
function inferPGFromBlock(blockCode) {
  if (!blockCode) return '';
  const cleanBlock = blockCode.trim();
  if (cleanBlock.startsWith('0')) return 'PG1';
  if (cleanBlock.startsWith('4')) return 'PG4';
  if (cleanBlock.startsWith('5')) return 'PG3';
  return ''; // Return empty if it doesn't match standard prefix
}

module.exports = {
  getWeekNumber,
  getMonthFromDate,
  getYearFromDate,
  getAgeInMonths,
  inferPGFromBlock
};
