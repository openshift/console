import * as _ from 'lodash';

// Conversions between units and milliseconds
const s = 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const w = d * 7;
const units = { w, d, h, m, s };

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
