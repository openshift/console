import * as _ from 'lodash';
import {
  asValidationObject,
  joinGrammaticallyListOfItems,
  ValidationErrorType,
} from '@console/shared/src';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { intervalBracket } from '../../strings';
import { IntegerValidationResult } from './types';

const humanize = (value: number) =>
  Number.isFinite(value) ? humanizeBinaryBytes(value).string : value;

export const combineIntegerValidationResults = (
  results: IntegerValidationResult[],
  defaultMin = Number.NEGATIVE_INFINITY,
  defaultMax = Number.POSITIVE_INFINITY,
) => {
  if (!results || results.length === 0) {
    return null;
  }
  let message;
  if (results.length === 1) {
    message = results[0].errorMsg;
  } else {
    const maxBoundsResult = results.find(
      ({ min, max }) => min === defaultMin && max === defaultMax,
    );
    if (maxBoundsResult) {
      message = maxBoundsResult.errorMsg;
    } else {
      message = `Memory must be in one of these intervals: ${joinGrammaticallyListOfItems(
        _.uniqWith(results, (a, b) => a.min === b.min && a.max === b.max)
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
  return asValidationObject(message, ValidationErrorType.Error);
};
