import {
  bucketClassNameRegex,
  consecutivePeriodsAndHyphensRegex,
  TimeUnits,
} from '../constants/bucket-class';

export const validateBucketClassName = (name: string): boolean =>
  name.length >= 3 &&
  name.length <= 63 &&
  bucketClassNameRegex.test(name) &&
  !consecutivePeriodsAndHyphensRegex.test(name);

export const validateDuration = (ms: number): boolean => ms >= 900000 && ms <= 86400000;

export const convertToMS = ({ unit, value }) =>
  unit === TimeUnits.HOUR ? parseInt(value, 10) * 3600000 : parseInt(value, 10) * 60000;
