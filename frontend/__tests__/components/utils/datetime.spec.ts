import {
  fromNow,
  isValid,
  formatDuration,
  formatPrometheusDuration,
  parsePrometheusDuration,
} from '../../../public/components/utils/datetime';

describe('fromNow', () => {
  it('prints past dates correctly', () => {
    expect(fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 00:00:02'))).toEqual(
      'a few seconds ago',
    );
    expect(fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 00:01:00'))).toEqual(
      'a minute ago',
    );
    expect(fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 00:51:00'))).toEqual(
      'an hour ago',
    );
    expect(fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 12:45:00'))).toEqual(
      '13 hours ago',
    );
    expect(fromNow(new Date('Jan 01 1970'), new Date('Jan 02 1970'))).toEqual('a day ago');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Jan 09 1970'))).toEqual('8 days ago');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Feb 02 1970'))).toEqual('a month ago');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Mar 02 1970'))).toEqual('2 months ago');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Feb 02 1971'))).toEqual('a year ago');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Feb 02 1973'))).toEqual('3 years ago');
  });

  it('prints past dates with no prefixes/suffixes correctly', () => {
    expect(
      fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 00:00:02'), {
        omitSuffix: true,
      }),
    ).toEqual('few seconds');
    expect(
      fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 00:01:00'), {
        omitSuffix: true,
      }),
    ).toEqual('minute');
    expect(
      fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 00:51:00'), {
        omitSuffix: true,
      }),
    ).toEqual('hour');
    expect(
      fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 12:45:00'), {
        omitSuffix: true,
      }),
    ).toEqual('13 hours');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Jan 02 1970'), { omitSuffix: true })).toEqual(
      'day',
    );
    expect(fromNow(new Date('Jan 01 1970'), new Date('Jan 09 1970'), { omitSuffix: true })).toEqual(
      '8 days',
    );
    expect(fromNow(new Date('Jan 01 1970'), new Date('Feb 02 1970'), { omitSuffix: true })).toEqual(
      'month',
    );
    expect(fromNow(new Date('Jan 01 1970'), new Date('Mar 02 1970'), { omitSuffix: true })).toEqual(
      '2 months',
    );
    expect(fromNow(new Date('Jan 01 1970'), new Date('Feb 02 1971'), { omitSuffix: true })).toEqual(
      'year',
    );
    expect(fromNow(new Date('Jan 01 1970'), new Date('Feb 02 1973'), { omitSuffix: true })).toEqual(
      '3 years',
    );
  });

  it('prints future dates correctly', () => {
    expect(fromNow(new Date('Jan 01 1970 00:00:02'), new Date('Jan 01 1970 00:00:00'))).toEqual(
      'a few seconds from now',
    );
    expect(fromNow(new Date('Jan 01 1970 00:01:01'), new Date('Jan 01 1970 00:00:00'))).toEqual(
      'a minute from now',
    );
    expect(fromNow(new Date('Jan 01 1970 01:01:00'), new Date('Jan 01 1970 00:00:00'))).toEqual(
      'an hour from now',
    );
    expect(fromNow(new Date('Jan 01 1970 14:20:00'), new Date('Jan 01 1970 00:00:00'))).toEqual(
      '14 hours from now',
    );
    expect(fromNow(new Date('Jan 02 1970'), new Date('Jan 01 1970'))).toEqual('a day from now');
    expect(fromNow(new Date('Jan 09 1970'), new Date('Jan 01 1970'))).toEqual('8 days from now');
    expect(fromNow(new Date('Feb 02 1970'), new Date('Jan 01 1970'))).toEqual('a month from now');
    expect(fromNow(new Date('Mar 01 1970'), new Date('Jan 01 1970'))).toEqual('2 months from now');
    expect(fromNow(new Date('Feb 02 1971'), new Date('Jan 01 1970'))).toEqual('a year from now');
    expect(fromNow(new Date('Feb 02 1973'), new Date('Jan 01 1970'))).toEqual('3 years from now');
  });

  it('check for null value', () => {
    expect(fromNow(null, new Date('Jan 01 1970 00:00:00'))).toEqual('-');
  });
});

describe('isValid', () => {
  it('rejects non-dates', () => {
    expect(isValid('hello' as any)).toEqual(false);
  });

  it('accepts 0 epoch date', () => {
    expect(isValid(new Date(0))).toEqual(true);
  });

  it('accepts now', () => {
    expect(isValid(new Date())).toEqual(true);
  });
});

describe('formatDuration', () => {
  const toMS = (h: number, m: number, s: number) => (h * 60 * 60 + m * 60 + s) * 1000;

  it('prints durations correctly', () => {
    expect(formatDuration(toMS(0, 0, 1))).toEqual('1s');
    expect(formatDuration(toMS(0, 0, 23))).toEqual('23s');
    expect(formatDuration(toMS(0, 3, 42))).toEqual('3m 42s');
    expect(formatDuration(toMS(2, 0, 0))).toEqual('2h 0m 0s');
    expect(formatDuration(toMS(1, 0, 4))).toEqual('1h 0m 4s');
    expect(formatDuration(toMS(13, 10, 23))).toEqual('13h 10m 23s');
  });

  it('handles hours greater than 24', () => {
    expect(formatDuration(toMS(273, 18, 3))).toEqual('273h 18m 3s');
  });

  it('handles 0 values', () => {
    expect(formatDuration(0)).toEqual('0s');
  });

  it('returns the empty string for negative values', () => {
    expect(formatDuration(-88210)).toEqual('');
  });

  it('handles null and undefined values', () => {
    expect(formatDuration(null)).toEqual('');
    expect(formatDuration(undefined)).toEqual('');
  });

  it('rounds seconds correctly', () => {
    expect(formatDuration(499)).toEqual('0s');
    expect(formatDuration(500)).toEqual('1s');
    expect(formatDuration(toMS(0, 3, 42) + 499)).toEqual('3m 42s');
    expect(formatDuration(toMS(0, 3, 42) + 500)).toEqual('3m 43s');
  });
});

// Converts time durations to milliseconds
const ms = (s = 0, m = 0, h = 0, d = 0, w = 0) =>
  ((((w * 7 + d) * 24 + h) * 60 + m) * 60 + s) * 1000;

describe('formatPrometheusDuration', () => {
  it('formats durations correctly', () => {
    expect(formatPrometheusDuration(ms(1))).toEqual('1s');
    expect(formatPrometheusDuration(ms(2, 1))).toEqual('1m 2s');
    expect(formatPrometheusDuration(ms(3, 2, 1))).toEqual('1h 2m 3s');
    expect(formatPrometheusDuration(ms(4, 3, 2, 1))).toEqual('1d 2h 3m 4s');
    expect(formatPrometheusDuration(ms(5, 4, 3, 2, 1))).toEqual('1w 2d 3h 4m 5s');
  });

  it('handles invalid values', () => {
    [null, undefined, 0, -1, -9999].forEach((v) => expect(formatPrometheusDuration(v)).toEqual(''));
  });
});

describe('parsePrometheusDuration', () => {
  it('parses durations correctly', () => {
    expect(parsePrometheusDuration('1s')).toEqual(ms(1));
    expect(parsePrometheusDuration('100s')).toEqual(ms(100));
    expect(parsePrometheusDuration('1m')).toEqual(ms(0, 1));
    expect(parsePrometheusDuration('90m')).toEqual(ms(0, 90));
    expect(parsePrometheusDuration('1h')).toEqual(ms(0, 0, 1));
    expect(parsePrometheusDuration('2h 0m 0s')).toEqual(ms(0, 0, 2));
    expect(parsePrometheusDuration('13h 10m 23s')).toEqual(ms(23, 10, 13));
    expect(parsePrometheusDuration('25h 61m 61s')).toEqual(ms(61, 61, 25));
    expect(parsePrometheusDuration('123h')).toEqual(ms(0, 0, 123));
    expect(parsePrometheusDuration('1d')).toEqual(ms(0, 0, 0, 1));
    expect(parsePrometheusDuration('2d 6h')).toEqual(ms(0, 0, 6, 2));
    expect(parsePrometheusDuration('8d 12h')).toEqual(ms(0, 0, 12, 8));
    expect(parsePrometheusDuration('10d 12h 30m 1s')).toEqual(ms(1, 30, 12, 10));
    expect(parsePrometheusDuration('1w')).toEqual(ms(0, 0, 0, 0, 1));
    expect(parsePrometheusDuration('5w 10d 12h 30m 1s')).toEqual(ms(1, 30, 12, 10, 5));
    expect(parsePrometheusDuration('999w 999h 999s')).toEqual(ms(999, 0, 999, 0, 999));
  });

  it('handles 0 values', () => {
    expect(parsePrometheusDuration('0s')).toEqual(0);
    expect(parsePrometheusDuration('0w 0d 0h 0m 0s')).toEqual(0);
    expect(parsePrometheusDuration('00h 000000m 0s')).toEqual(0);
  });

  it('handles invalid duration formats', () => {
    [
      '',
      null,
      undefined,
      '0',
      '12',
      'z',
      'h',
      'abc',
      '全角',
      '0.5h',
      '1hh',
      '1h1m',
      '1h h',
      '1h 0',
      '1h 0z',
      '-1h',
    ].forEach((v) => expect(parsePrometheusDuration(v)).toEqual(0));
  });

  it('mirrors formatPrometheusDuration()', () => {
    [
      '1s',
      '1m',
      '1h',
      '1m 40s',
      '13h 10m 23s',
      '2h 10s',
      '1d',
      '2d 6h',
      '1w',
      '5w 6d 12h 30m 1s',
      '999w',
      '',
    ].forEach((v) => expect(formatPrometheusDuration(parsePrometheusDuration(v))).toEqual(v));
  });
});
