/* eslint-disable lines-between-class-members */
import * as _ from 'lodash';
import { ValidationErrorType } from '@console/shared/src';
import { ValueEnum, DiskBus } from '../../../constants';
import { CommonTemplatesValidation } from '../../../types/template';
import {
  IntervalValidationResult,
  MemoryIntervalValidationResult,
} from './interval-validation-result';
import { DiskBusValidationResult } from './disk-bus-validation-result';

// TODO: Add all the fields in the form
export class ValidationJSONPath extends ValueEnum<string> {
  static readonly CPU = new ValidationJSONPath('jsonpath::.spec.domain.cpu.cores');
  static readonly MEMORY = new ValidationJSONPath(
    'jsonpath::.spec.domain.resources.requests.memory',
  );
  static readonly BUS = new ValidationJSONPath('jsonpath::.spec.domain.devices.disks[*].disk.bus');
}

export class TemplateValidations {
  private validations: CommonTemplatesValidation[];

  constructor(validations: CommonTemplatesValidation[] = []) {
    this.validations = _.compact(validations);
  }

  validateMemory = (value: number): IntervalValidationResult => {
    const result = this.validateMemoryByType(value, ValidationErrorType.Error);
    if (!result.isValid) {
      return result;
    }

    return this.validateMemoryByType(value, ValidationErrorType.Warn);
  };

  getAllowedBuses = (
    validationErrorType: ValidationErrorType = ValidationErrorType.Error,
  ): Set<DiskBus> => {
    const allowedBuses = this.getAllowedEnumValues(ValidationJSONPath.BUS, validationErrorType).map(
      DiskBus.fromString,
    );

    return new Set(allowedBuses.length === 0 ? DiskBus.getAll() : allowedBuses);
  };

  getRecommendedBuses = (): Set<DiskBus> => {
    const allowedBuses = this.getAllowedBuses();
    const recommendedBuses = [...this.getAllowedBuses(ValidationErrorType.Warn)].filter((b) =>
      allowedBuses.has(b),
    );
    return recommendedBuses.length === 0 ? allowedBuses : new Set(recommendedBuses);
  };

  validateBus = (
    bus: DiskBus,
    validationErrorType: ValidationErrorType = ValidationErrorType.Error,
  ): DiskBusValidationResult => {
    const allowedBuses = this.getAllowedBuses();
    if (allowedBuses.has(bus)) {
      const recommededBuses = this.getRecommendedBuses();
      return new DiskBusValidationResult({
        allowedBuses: recommededBuses,
        type: ValidationErrorType.Warn,
        isValid: recommededBuses.has(bus),
      });
    }

    return new DiskBusValidationResult({
      allowedBuses,
      type: validationErrorType,
      isValid: allowedBuses.has(bus),
    });
  };

  getDefaultBus = (defaultBus = DiskBus.VIRTIO): DiskBus => {
    const allowedBuses = this.getAllowedBuses();
    if (allowedBuses.size === 0) {
      return defaultBus;
    }
    return allowedBuses.has(defaultBus) ? defaultBus : [...allowedBuses][0];
  };

  private validateMemoryByType = (
    value: number,
    type: ValidationErrorType,
  ): IntervalValidationResult =>
    new MemoryIntervalValidationResult(
      this.validateInterval(value, ValidationJSONPath.MEMORY, {
        defaultMin: 0,
        isDefaultMinInclusive: false,
        type,
      }),
    );

  private validateInterval = (
    value: number,
    jsonPath: ValidationJSONPath,
    {
      isDefaultMinInclusive = true,
      isDefaultMaxInclusive = true,
      defaultMin = Number.NEGATIVE_INFINITY,
      defaultMax = Number.POSITIVE_INFINITY,
      type = ValidationErrorType.Error,
    },
  ): IntervalValidationResult => {
    const relevantValidations = this.getRelevantValidations(jsonPath, type);

    // combine validations for single template and make them strict (all integer validations must pass)
    const { min, max, isMinInclusive, isMaxInclusive } = relevantValidations.reduce(
      (
        {
          min: oldMin,
          max: oldMax,
          isMinInclusive: oldIsMinInclusive,
          isMaxInclusive: oldIsMaxInclusive,
        },
        validation,
      ) => {
        let newMin = oldMin;
        let newMax = oldMax;
        let newIsMinInclusive = oldIsMinInclusive;
        let newIsMaxInclusive = oldIsMaxInclusive;

        if ('min' in validation && validation.min >= oldMin) {
          newMin = validation.min;
          newIsMinInclusive = true;
        }
        if ('max' in validation && validation.max <= oldMax) {
          newMax = validation.max;
          newIsMaxInclusive = true;
        }
        return {
          min: newMin,
          max: newMax,
          isMinInclusive: newIsMinInclusive,
          isMaxInclusive: newIsMaxInclusive,
        };
      },
      {
        min: defaultMin,
        max: defaultMax,
        isMinInclusive: isDefaultMinInclusive,
        isMaxInclusive: isDefaultMaxInclusive,
      },
    );

    const isValid =
      (isMinInclusive ? min <= value : min < value) &&
      (isMaxInclusive ? value <= max : value < max);

    return new IntervalValidationResult({
      type,
      isValid,
      min,
      max,
      isMinInclusive,
      isMaxInclusive,
    });
  };

  // Empty array means all values are allowed
  private getAllowedEnumValues = (
    jsonPath: ValidationJSONPath,
    type: ValidationErrorType,
  ): string[] => {
    const relevantValidations = this.getRelevantValidations(jsonPath, type);

    return relevantValidations.reduce(
      (result: string[], validation: CommonTemplatesValidation) => result.concat(validation.values),
      [],
    );
  };

  private getRelevantValidations = (jsonPath: ValidationJSONPath, type: ValidationErrorType) => {
    return this.validations.filter(
      (validation: CommonTemplatesValidation) =>
        validation.path.includes(jsonPath.getValue()) &&
        (type === ValidationErrorType.Warn) === !!validation.justWarning,
    );
  };
}
