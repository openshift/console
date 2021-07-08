import { ONE_HOUR, ONE_DAY } from './time';

export enum DurationKeys {
  OneHour = 'OneHour',
  SixHours = 'SixHours',
  TwentyFourHours = 'TwentyFourHours',
}

export const DURATION_VALUES = {
  [DurationKeys.OneHour]: ONE_HOUR,
  [DurationKeys.SixHours]: 6 * ONE_HOUR,
  [DurationKeys.TwentyFourHours]: ONE_DAY,
};

export const DEFAULT_DURATION_KEY = DurationKeys.OneHour;
export const DEFAULT_DURATION = DURATION_VALUES[DEFAULT_DURATION_KEY];
