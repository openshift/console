import * as _ from 'lodash-es';

// Behaves like moment.js's fromNow
export const fromNow = (dateTime, now = undefined, options = { omitSuffix: false }) => {
  // Check for null. If dateTime is null, it returns incorrect date and time of Wed Dec 31 1969 19:00:00 GMT-0500 (Eastern Standard Time)
  if (!dateTime) {
    return '-';
  }
  if (!now) {
    now = new Date();
  }
  dateTime = new Date(dateTime);
  const secondsAgo = (now.getTime() - dateTime.getTime()) / 1000;
  const minutesAgo = secondsAgo / 60;
  const hoursAgo = minutesAgo / 60;
  const daysAgo = hoursAgo / 24;

  if (daysAgo > 548) {
    const count = Math.round(daysAgo / 365);
    return options.omitSuffix ? `${count} years` : `${count} years ago`;
  }
  if (daysAgo > 320) {
    return options.omitSuffix ? 'year' : 'a year ago';
  }
  if (daysAgo > 45) {
    const count = Math.round(daysAgo / 30);
    return options.omitSuffix ? `${count} months` : `${count} months ago`;
  }
  if (daysAgo > 26) {
    return options.omitSuffix ? 'month' : 'a month ago';
  }
  if (hoursAgo > 36) {
    const count = Math.round(daysAgo);
    return options.omitSuffix ? `${count} days` : `${count} days ago`;
  }
  if (hoursAgo > 22) {
    return options.omitSuffix ? 'day' : 'a day ago';
  }
  if (minutesAgo > 90) {
    const count = Math.round(hoursAgo);
    return options.omitSuffix ? `${count} hours` : `${count} hours ago`;
  }
  if (minutesAgo > 45) {
    return options.omitSuffix ? 'hour' : 'an hour ago';
  }
  if (secondsAgo > 90) {
    const count = Math.round(minutesAgo);
    return options.omitSuffix ? `${count} minutes` : `${count} minutes ago`;
  }
  if (secondsAgo > 45) {
    return options.omitSuffix ? 'minute' : 'a minute ago';
  }
  if (secondsAgo > 15) {
    return options.omitSuffix ? 'few seconds' : 'less than a minute ago';
  }

  if (secondsAgo >= 0) {
    return options.omitSuffix ? 'few seconds' : 'a few seconds ago';
  }

  if (secondsAgo > -45) {
    return 'a few seconds from now';
  }
  if (secondsAgo > -90) {
    return 'a minute from now';
  }
  if (minutesAgo > -45) {
    return `${-Math.round(minutesAgo)} minutes from now`;
  }
  if (minutesAgo > -90) {
    return 'an hour from now';
  }
  if (hoursAgo > -22) {
    return `${-Math.round(hoursAgo)} hours from now`;
  }
  if (hoursAgo > -36) {
    return 'a day from now';
  }
  if (daysAgo > -26) {
    return `${-Math.round(daysAgo)} days from now`;
  }
  if (daysAgo > -45) {
    return 'a month from now';
  }
  if (daysAgo > -320) {
    return `${-Math.round(daysAgo / 30)} months from now`;
  }
  if (daysAgo > -580) {
    return 'a year from now';
  }
  return `${-Math.round(daysAgo / 365)} years from now`;
};

export const isValid = (dateTime: Date) => dateTime instanceof Date && !_.isNaN(dateTime.valueOf());

// Formats a duration in milliseconds like '1h 10m 23s'.
export const formatDuration = (ms: number) => {
  if (!_.isFinite(ms) || ms < 0) {
    return '';
  }

  const totalSeconds = Math.round(ms / 1000);
  const secondsInHour = 60 * 60;
  const secondsInMinute = 60;

  const hours = Math.floor(totalSeconds / secondsInHour);
  const minutes = Math.floor((totalSeconds % secondsInHour) / secondsInMinute);
  const seconds = totalSeconds % secondsInMinute;

  let formatted = '';
  if (hours) {
    formatted += `${hours}h `;
  }
  if (hours || minutes) {
    formatted += `${minutes}m `;
  }
  formatted += `${seconds}s`;

  return formatted;
};

// Conversions between units and milliseconds
const s = 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const w = d * 7;
const units = { w, d, h, m, s };

// Formats a duration in milliseconds like "1h 10m"
export const formatPrometheusDuration = (ms: number) => {
  if (!_.isFinite(ms) || ms < 0) {
    return '';
  }
  let remaining = ms;
  let str = '';
  _.each(units, (factor, unit) => {
    const n = Math.floor(remaining / factor);
    if (n > 0) {
      str += `${n}${unit} `;
      remaining -= n * factor;
    }
  });
  return _.trim(str);
};

// Converts a duration like "1h 10m 23s" to milliseconds or returns 0 if the duration could not be parsed
export const parsePrometheusDuration = (duration: string): number => {
  try {
    const parts = duration
      .trim()
      .split(/\s+/)
      .map((p) => p.match(/^(\d+)([wdhms])$/));
    return _.sumBy(parts, (p) => parseInt(p[1], 10) * units[p[2]]);
  } catch (ignored) {
    // Invalid duration format
    return 0;
  }
};

const zeroPad = (number: number) => (number < 10 ? `0${number}` : number);

export const twentyFourHourTime = (date: Date): string => {
  const hours = zeroPad(date.getHours());
  const minutes = zeroPad(date.getMinutes());
  return `${hours}:${minutes}`;
};

export const twentyFourHourTimeWithSeconds = (date: Date): string => {
  const hours = zeroPad(date.getHours());
  const minutes = zeroPad(date.getMinutes());
  const seconds = zeroPad(date.getSeconds());
  return `${hours}:${minutes}:${seconds}`;
};
