import i18n from 'i18next';
import * as _ from 'lodash';
import { getLastLanguage } from '@console/app/src/components/user-preferences/language/getLastLanguage';

// Conversions between units and milliseconds
const units = {
  w: 1000 * 60 * 60 * 24 * 7,
  d: 1000 * 60 * 60 * 24,
  h: 1000 * 60 * 60,
  m: 1000 * 60,
  s: 1000,
};

// The maximum allowed clock skew in milliseconds where we show a date as "Just now" even if it is from the future.
export const maxClockSkewMS = -60000;
const lang = getLastLanguage();

// https://tc39.es/ecma402/#datetimeformat-objects
export const timeFormatter = new Intl.DateTimeFormat(lang, {
  hour: 'numeric',
  minute: 'numeric',
});

export const timeFormatterWithSeconds = new Intl.DateTimeFormat(lang, {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

export const dateFormatter = new Intl.DateTimeFormat(lang, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const dateFormatterNoYear = new Intl.DateTimeFormat(lang, {
  month: 'short',
  day: 'numeric',
});

export const dateTimeFormatter = (langArg?: string) =>
  new Intl.DateTimeFormat(langArg ?? lang, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    year: 'numeric',
  });

export const dateTimeFormatterWithSeconds = new Intl.DateTimeFormat(lang, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  year: 'numeric',
});

export const utcDateTimeFormatter = new Intl.DateTimeFormat(lang, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
  timeZoneName: 'short',
});

export const relativeTimeFormatter = (langArg?: string) =>
  Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat(langArg ?? lang) : null;

export const getDuration = (ms: number) => {
  const milliseconds = Math.max(ms ?? 0, 0);
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  seconds %= 60;
  let hours = Math.floor(minutes / 60);
  minutes %= 60;
  const days = Math.floor(hours / 24);
  hours %= 24;
  return { days, hours, minutes, seconds };
};

export const fromNow = (dateTime: string | Date, now?: Date, options?, langArg?: string) => {
  // Check for null. If dateTime is null, it returns incorrect date Jan 1 1970.
  if (!dateTime) {
    return '-';
  }

  const d = new Date(dateTime);
  const ms = (now ?? new Date()).getTime() - d.getTime();
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
  if (!relativeTimeFormatter(langArg)) {
    return dateTimeFormatter().format(d);
  }

  if (!days && !hours && !minutes) {
    return justNow;
  }

  if (days) {
    return relativeTimeFormatter(langArg).format(-days, 'day');
  }

  if (hours) {
    return relativeTimeFormatter(langArg).format(-hours, 'hour');
  }

  return relativeTimeFormatter(langArg).format(-minutes, 'minute');
};

export const isValid = (dateTime: Date) => dateTime instanceof Date && !_.isNaN(dateTime.valueOf());

const zeroPad = (number: number) => (number < 10 ? `0${number}` : number);

export const twentyFourHourTime = (date: Date, showSeconds?: boolean): string => {
  const hours = zeroPad(date.getHours() ?? 0);
  const minutes = `:${zeroPad(date.getMinutes() ?? 0)}`;
  const seconds = showSeconds ? `:${zeroPad(date.getSeconds() ?? 0)}` : '';
  return `${hours}${minutes}${seconds}`;
};

export const timestampFor = (mdate: Date, now: Date, omitSuffix: boolean, language: string) => {
  if (!isValid(mdate)) {
    return '-';
  }

  const timeDifference = now.getTime() - mdate.getTime();
  if (omitSuffix) {
    return fromNow(mdate, undefined, { omitSuffix: true }, language);
  }

  // Show a relative time if within 10.5 minutes in the past from the current time.
  if (timeDifference > maxClockSkewMS && timeDifference < 630000) {
    return fromNow(mdate, undefined, undefined, language);
  }

  // Apr 23, 2021, 4:33 PM
  return dateTimeFormatter(language).format(mdate);
};

/**
 * Converts a duration in milliseconds to a Prometheus time duration string like "1h 10m"
 * @param {number} ms - Time duration in milliseconds
 * @returns {string} The duration converted to a Prometheus time duration string
 * @example
 * ```
 * formatPrometheusDuration(65000) // Returns "1m 5s"
 * ```
 */
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

/**
 * Converts a Prometheus time duration like "1h 10m 23s" to milliseconds
 * @param {string} duration - Prometheus time duration string
 * @returns {number} The duration converted to a Prometheus time duration string or 0 if the duration could not be parsed
 * @example
 * ```
 * parsePrometheusDuration("1m 5s") // Returns 65000
 * ```
 */
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
