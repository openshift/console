import { bucketClassNameRegex, consecutivePeriodsAndHyphensRegex } from '../constants/bucket-class';

export const validateBucketClassName = (name: string): boolean =>
  name.length >= 3 &&
  name.length <= 63 &&
  bucketClassNameRegex.test(name) &&
  !consecutivePeriodsAndHyphensRegex.test(name);
