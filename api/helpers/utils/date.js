/**
 * Lightweight date formatting utility.
 * Usage:
 * const { formatDate } = require('../helpers/utils/date');
 * formatDate('2025-10-20T23:10:58.813Z') // default: '2025-10-20 23:10:58'
 * formatDate(dateObj, { format: 'date' }) // '2025-10-20'
 * formatDate(dateObj, { format: 'time' }) // '23:10:58'
 * formatDate(dateObj, { locale: 'en-GB', options: { weekday: 'short' } })
 */

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

const formatDate = (dateInput, opts = {}) => {
  if (!dateInput) return null;

  const { format = "datetime", locale, options = {} } = opts;

  let date;
  if (typeof dateInput === "string" || typeof dateInput === "number") {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return null;
  }

  if (Number.isNaN(date.getTime())) return null;

  if (format === "iso") return date.toISOString();

  if (format === "date") {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}`;
  }

  if (format === "time") {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}`;
  }

  // default: datetime 'YYYY-MM-DD HH:mm:ss'
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
  let result = `${datePart} ${timePart}`;

  // If locale or options provided, use Intl.DateTimeFormat for human readable
  if (locale || Object.keys(options).length) {
    try {
      result = new Intl.DateTimeFormat(locale || undefined, options).format(
        date
      );
    } catch (e) {
      // fallback to default result
    }
  }

  return result;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result; // returns JS Date object
};

module.exports = { formatDate, addDays };
