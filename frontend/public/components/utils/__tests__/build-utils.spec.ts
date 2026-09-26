import { displayDurationInWords } from '../build-utils';

jest.mock('i18next', () => ({
  t: (key: string) => key.replace('public~', ''),
}));

describe('displayDurationInWords', () => {
  it('returns - when start is missing', () => {
    expect(displayDurationInWords('', '2024-01-01T00:00:00Z')).toEqual('-');
  });

  it('formats sub-hour durations', () => {
    expect(
      displayDurationInWords('2024-01-01T00:00:00Z', '2024-01-01T00:01:05Z'),
    ).toEqual('1 minute 5 seconds');
  });

  it('formats multi-hour durations', () => {
    expect(
      displayDurationInWords('2024-01-01T00:00:00Z', '2024-01-01T01:02:03Z'),
    ).toEqual('1 hour 2 minutes 3 seconds');
  });

  it('formats durations longer than 60 hours', () => {
    expect(
      displayDurationInWords('2024-01-01T00:00:00Z', '2024-01-05T04:00:00Z'),
    ).toEqual('100 hours');
  });

  it('returns - for invalid timestamps', () => {
    expect(displayDurationInWords('invalid', '2024-01-01T00:00:00Z')).toEqual('-');
  });
});
