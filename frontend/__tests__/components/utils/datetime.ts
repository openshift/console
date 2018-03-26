import { fromNow, isValid } from '../../../public/components/utils/datetime';

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
