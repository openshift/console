/* eslint-disable lines-between-class-members */
import * as _ from 'lodash';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { ValueEnum } from '../../../constants';
import { CommonTemplatesValidation } from '../../../types/template';
import { IntegerValidationResult } from './types';

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

  validateMemory = (value: number): IntegerValidationResult => {
    const { min, max, isMinInclusive, isMaxInclusive, isValid } = this.validateInteger(
      value,
      ValidationJSONPath.MEMORY,
      {
        defaultMin: 0,
        isDefaultMinInclusive: false,
      },
    );

    let errorMsg = null;

    if (!isValid) {
      if (min !== 0 && Number.isFinite(min) && Number.isFinite(max)) {
        errorMsg = `Memory must be between ${humanizeBinaryBytes(min).string} and ${
          humanizeBinaryBytes(max).string
        }`;
      } else if (Number.isFinite(max)) {
        errorMsg = `Memory must be below ${humanizeBinaryBytes(max).string}`;
      } else {
        errorMsg = `Memory must be above ${humanizeBinaryBytes(min).string}`;
      }
    }
    return { isValid, errorMsg, min, max, isMinInclusive, isMaxInclusive };
  };

  private validateInteger = (
    value: number,
    jsonPath: ValidationJSONPath,
    {
      isDefaultMinInclusive = true,
      isDefaultMaxInclusive = true,
      defaultMin = Number.NEGATIVE_INFINITY,
      defaultMax = Number.POSITIVE_INFINITY,
    },
  ) => {
    const relevantValidations = this.getRelevantValidations(jsonPath);

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

    return { min, max, isMinInclusive, isMaxInclusive, isValid };
  };

  getAllowedBusses = (): Set<string> => this.getAllowedEnumValues(ValidationJSONPath.BUS);

  private getAllowedEnumValues = (jsonPath: ValidationJSONPath): Set<string> => {
    // Empty array means all values are allowed

    // Get all the validations which has the 'values' key and aren't optional
    const relevantValidations = this.getRelevantValidations(jsonPath).filter(
      (validation) => !validation.justWarning && 'values' in validation,
    );

    return new Set(
      relevantValidations.reduce(
        (result: string[], validation: CommonTemplatesValidation) =>
          result.concat(validation.values),
        [],
      ),
    );
  };

  private getRelevantValidations = (jsonPath: ValidationJSONPath) =>
    this.validations.filter((validation: CommonTemplatesValidation) =>
      validation.path.includes(jsonPath.getValue()),
    );
}
