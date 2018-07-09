import { fromNow, isValid, formatDuration } from '../../../public/components/utils/datetime';

describe('fromNow', () => {
  it('prints past dates correctly', () => {
    expect(fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 00:00:02'))).toEqual('a few seconds ago');
    expect(fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 00:01:00'))).toEqual('a minute ago');
    expect(fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 00:51:00'))).toEqual('an hour ago');
    expect(fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 12:45:00'))).toEqual('13 hours ago');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Jan 02 1970'))).toEqual('a day ago');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Jan 09 1970'))).toEqual('8 days ago');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Feb 02 1970'))).toEqual('a month ago');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Mar 02 1970'))).toEqual('2 months ago');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Feb 02 1971'))).toEqual('a year ago');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Feb 02 1973'))).toEqual('3 years ago');
  });

  it('prints past dates with no prefixes/suffixes correctly', ()=> {
    expect(fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 00:00:02'), {omitSuffix: true})).toEqual('few seconds');
    expect(fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 00:01:00'), {omitSuffix: true})).toEqual('minute');
    expect(fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 00:51:00'), {omitSuffix: true})).toEqual('hour');
    expect(fromNow(new Date('Jan 01 1970 00:00:00'), new Date('Jan 01 1970 12:45:00'), {omitSuffix: true})).toEqual('13 hours');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Jan 02 1970'), {omitSuffix: true})).toEqual('day');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Jan 09 1970'), {omitSuffix: true})).toEqual('8 days');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Feb 02 1970'), {omitSuffix: true})).toEqual('month');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Mar 02 1970'), {omitSuffix: true})).toEqual('2 months');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Feb 02 1971'), {omitSuffix: true})).toEqual('year');
    expect(fromNow(new Date('Jan 01 1970'), new Date('Feb 02 1973'), {omitSuffix: true})).toEqual('3 years');
  });

  it('prints future dates correctly', () => {
    expect(fromNow(new Date('Jan 01 1970 00:00:02'), new Date('Jan 01 1970 00:00:00'))).toEqual('a few seconds from now');
    expect(fromNow(new Date('Jan 01 1970 00:01:01'), new Date('Jan 01 1970 00:00:00'))).toEqual('a minute from now');
    expect(fromNow(new Date('Jan 01 1970 01:01:00'), new Date('Jan 01 1970 00:00:00'))).toEqual('an hour from now');
    expect(fromNow(new Date('Jan 01 1970 14:20:00'), new Date('Jan 01 1970 00:00:00'))).toEqual('14 hours from now');
    expect(fromNow(new Date('Jan 02 1970'), new Date('Jan 01 1970'))).toEqual('a day from now');
    expect(fromNow(new Date('Jan 09 1970'), new Date('Jan 01 1970'))).toEqual('8 days from now');
    expect(fromNow(new Date('Feb 02 1970'), new Date('Jan 01 1970'))).toEqual('a month from now');
    expect(fromNow(new Date('Mar 01 1970'), new Date('Jan 01 1970'))).toEqual('2 months from now');
    expect(fromNow(new Date('Feb 02 1971'), new Date('Jan 01 1970'))).toEqual('a year from now');
    expect(fromNow(new Date('Feb 02 1973'), new Date('Jan 01 1970'))).toEqual('3 years from now');
  });
});

describe('isValid', () => {
  it('rejects non-dates', () => {
    expect(isValid('hello' as (any))).toEqual(false);
  });

  it('accepts 0 epoch date', () => {
    expect(isValid(new Date(0))).toEqual(true);
  });

  it('accepts now', () => {
    expect(isValid(new Date())).toEqual(true);
  });
});

describe('formatDuration', () => {
  const toMS = (h: number, m: number, s: number) => ((h * 60 * 60) + (m * 60) + s) * 1000;

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

