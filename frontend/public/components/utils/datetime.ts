import * as _ from 'lodash-es';
import i18n from 'i18next';

const getLocale = () => localStorage.getItem('bridge/language');

// The maximum allowed clock skew in milliseconds where we show a date as "Just now" even if it is from the future.
export const maxClockSkewMS = -60000;

// https://tc39.es/ecma402/#datetimeformat-objects
export const timeFormatter = new Intl.DateTimeFormat(getLocale() || undefined, {
  hour: 'numeric',
  minute: 'numeric',
});

export const timeFormatterWithSeconds = new Intl.DateTimeFormat(getLocale() || undefined, {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

export const dateFormatter = new Intl.DateTimeFormat(getLocale() || undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const dateFormatterNoYear = new Intl.DateTimeFormat(getLocale() || undefined, {
  month: 'short',
  day: 'numeric',
});

export const dateTimeFormatter = new Intl.DateTimeFormat(getLocale() || undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  year: 'numeric',
});

export const dateTimeFormatterWithSeconds = new Intl.DateTimeFormat(getLocale() || undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  year: 'numeric',
});

export const utcDateTimeFormatter = new Intl.DateTimeFormat(getLocale() || undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
  timeZoneName: 'short',
});

export const relativeTimeFormatter = Intl.RelativeTimeFormat
  ? new Intl.RelativeTimeFormat(getLocale() || undefined)
  : null;

export const getDuration = (ms: number) => {
  if (!ms || ms < 0) {
    ms = 0;
  }
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;
  let hours = Math.floor(minutes / 60);
  minutes = minutes % 60;
  const days = Math.floor(hours / 24);
  hours = hours % 24;
  return { days, hours, minutes, seconds };
};

export const fromNow = (dateTime: string | Date, now?: Date, options?) => {
  // Check for null. If dateTime is null, it returns incorrect date Jan 1 1970.
  if (!dateTime) {
    return '-';
  }

  if (!now) {
    now = new Date();
  }

  const d = new Date(dateTime);
  const ms = now.getTime() - d.getTime();
  const justNow = i18n.t('public~Just now');

  // If the event occurred less than one minute in the future, assume it's clock drift and show "Just now."
  if (!options?.omitSuffix && ms < 60000 && ms > maxClockSkewMS) {
    return justNow;
  }

  // Do not attempt to handle other dates in the future.
  if (ms < 0) {
    return '-';
  }

  const { days, hours, minutes } = getDuration(ms);

  if (options?.omitSuffix) {
    if (days) {
      return i18n.t('public~{{count}} day', { count: days });
    }
    if (hours) {
      return i18n.t('public~{{count}} hour', { count: hours });
    }
    return i18n.t('public~{{count}} minute', { count: minutes });
  }

  // Fallback to normal date/time formatting if Intl.RelativeTimeFormat is not
  // available. This is the case for older Safari versions.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat#browser_compatibility
  if (!relativeTimeFormatter) {
    return dateTimeFormatter.format(d);
  }

  if (!days && !hours && !minutes) {
    return justNow;
  }

  if (days) {
    return relativeTimeFormatter.format(-days, 'day');
  }

  if (hours) {
    return relativeTimeFormatter.format(-hours, 'hour');
  }

  return relativeTimeFormatter.format(-minutes, 'minute');
};

export const isValid = (dateTime: Date) => dateTime instanceof Date && !_.isNaN(dateTime.valueOf());

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

// Converts a duration like "1h 10m 23s" to milliseconds or returns 0 if the duration could not be
// parsed
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

// Get YYYY-MM-DD date string for a date object
export const toISODateString = (date: Date): string =>
  `${date.getFullYear()}-${zeroPad(date.getMonth() + 1)}-${zeroPad(date.getDate())}`;

export const twentyFourHourTime = (date: Date, showSeconds?: boolean): string => {
  const hours = zeroPad(date.getHours() ?? 0);
  const minutes = `:${zeroPad(date.getMinutes() ?? 0)}`;
  const seconds = showSeconds ? `:${zeroPad(date.getSeconds() ?? 0)}` : '';
  return `${hours}${minutes}${seconds}`;
};
