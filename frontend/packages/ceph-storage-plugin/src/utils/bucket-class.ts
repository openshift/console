import { TFunction } from 'i18next';
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

export const validateDuration = (ms: number): boolean => ms >= 0 && ms <= 86400000;

export const convertToMS = ({ unit, value }) =>
  unit === TimeUnits.HOUR ? parseInt(value, 10) * 3600000 : parseInt(value, 10) * 60000;

export const convertTime = (unit: TimeUnits, value: number): number =>
  unit === TimeUnits.HOUR ? value / 3600000 : value / 60000;

export const getTimeUnitString = (unit: TimeUnits, t: TFunction): string => {
  return unit === TimeUnits.HOUR ? t('ceph-storage-plugin~hr') : t('ceph-storage-plugin~min');
};
