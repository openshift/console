import * as _ from 'lodash';
import {
  asValidationObject,
  joinGrammaticallyListOfItems,
  ValidationErrorType,
} from '@console/shared/src';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { intervalBracket } from '../../strings';
import { Interval } from './types';
import { IntervalValidationResult } from './interval-validation-result';

const humanize = (value: number) =>
  Number.isFinite(value) ? humanizeBinaryBytes(value).string : value;

const intervalEquals = (a: Interval, b: Interval) =>
  a &&
  b &&
  a.min === b.min &&
  a.isMinInclusive === b.isMinInclusive &&
  a.max === b.max &&
  a.isMaxInclusive === b.isMaxInclusive;

export const combineIntegerValidationResults = (
  results: IntervalValidationResult[],
  {
    isDefaultMinInclusive = true,
    isDefaultMaxInclusive = true,
    defaultMin = Number.NEGATIVE_INFINITY,
    defaultMax = Number.POSITIVE_INFINITY,
  },
) => {
  if (!results || results.length === 0) {
    return null;
  }
  const uniqueResults = _.uniqWith(results, (a, b) => intervalEquals(a, b) && a.type === b.type);
  // these validations come from different templates so prefer Warn over Error
  const hasWarning = uniqueResults.some((r) => r.type === ValidationErrorType.Warn);
  const finalType = hasWarning ? ValidationErrorType.Warn : ValidationErrorType.Error;
  let message;
  if (uniqueResults.length === 1) {
    message = uniqueResults[0].getErrorMessage();
  } else {
    const defaultInterval = {
      min: defaultMin,
      max: defaultMax,
      isMaxInclusive: isDefaultMaxInclusive,
      isMinInclusive: isDefaultMinInclusive,
    };
    const maxBoundsResult = uniqueResults.find((r) => intervalEquals(r, defaultInterval));
    if (!hasWarning && maxBoundsResult) {
      message = maxBoundsResult.getErrorMessage();
    } else {
      const verb = finalType === ValidationErrorType.Warn ? 'should' : 'must';
      // include all types to show all intervals
      message = `Memory ${verb} be in one of these intervals: ${joinGrammaticallyListOfItems(
        _.uniqWith(results, intervalEquals)
          .sort((a, b) => a.min - b.min)
          .map(
            ({ min, max, isMinInclusive, isMaxInclusive }) =>
              `${intervalBracket(isMinInclusive, min)}${humanize(min)} - ${humanize(
                max,
              )}${intervalBracket(isMaxInclusive, null, max)}`,
          ),
        'or',
      )}`;
    }
  }
  return asValidationObject(message, finalType);
};
