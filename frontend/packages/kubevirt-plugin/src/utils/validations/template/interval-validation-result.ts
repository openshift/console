import { humanizeBinaryBytes } from '@console/internal/components/utils';
/* eslint-disable lines-between-class-members */
import { ValidationErrorType } from '../../../selectors';
import { Interval } from './types';

export class IntervalValidationResult implements Interval {
  type: ValidationErrorType;
  isValid: boolean;
  min?: number;
  max?: number;
  isMinInclusive?: boolean;
  isMaxInclusive?: boolean;

  constructor({
    type,
    isValid,
    min,
    max,
    isMinInclusive,
    isMaxInclusive,
  }: Interval & {
    isValid: boolean;
    type: ValidationErrorType;
  }) {
    this.type = type;
    this.isValid = isValid;
    this.min = min;
    this.max = max;
    this.isMinInclusive = isMinInclusive;
    this.isMaxInclusive = isMaxInclusive;
  }

  public getErrorMessage = () => (this.isValid ? null : 'Interval is not valid');
}

export class MemoryIntervalValidationResult extends IntervalValidationResult {
  public getErrorMessage = () => {
    const verb = this.type === ValidationErrorType.Warn ? 'should' : 'must';

    if (!this.isValid) {
      if (this.min !== 0 && Number.isFinite(this.min) && Number.isFinite(this.max)) {
        return `Memory ${verb} be between ${humanizeBinaryBytes(this.min).string} and ${
          humanizeBinaryBytes(this.max).string
        }`;
      }
      if (Number.isFinite(this.max)) {
        return `Memory ${verb} be ${this.isMaxInclusive ? 'at most' : 'below'} ${
          humanizeBinaryBytes(this.max).string
        }`;
      }
      return `Memory ${verb} be ${this.isMinInclusive ? 'at least' : 'above'} ${
        humanizeBinaryBytes(this.min).string
      }`;
    }
    return null;
  };
}
