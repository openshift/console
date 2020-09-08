import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash';
import { ValidationObject, ValidationErrorType } from '@console/shared';
import { UpdateOptions, ValidationConfig } from '../types';
import { SettingsFieldType } from '../../types';
import { isFieldRequired } from '../../selectors/immutable/field';
import { describeFields } from '../../utils/renderable-field-utils';
import { BinaryUnit } from '../../../form/size-unit-utils';
import { SELECT_PXE_NAD_ERROR, SELECT_PXE_NAD_ERROR_INFO } from '../../strings/networking';

export const getValidationUpdate = <FieldType>(
  config: ValidationConfig<FieldType>,
  options: UpdateOptions,
  fields: ImmutableMap<string, SettingsFieldType<FieldType>>,
  compareField: (prevState, state, id: string, key: any) => boolean,
) => {
  const { id, changedCommonData, prevState, getState } = options;
  const state = getState();

  return Object.keys(config).reduce((updateAcc, validationFieldKey) => {
    const { detectValueChanges, detectCommonDataChanges, validator } = config[validationFieldKey];

    const field = fields.get(validationFieldKey);

    if (field.get('skipValidation')) {
      return updateAcc;
    }

    const detectValues = _.isFunction(detectValueChanges)
      ? detectValueChanges(field, options)
      : detectValueChanges;
    const detectCommonData = _.isFunction(detectCommonDataChanges)
      ? detectCommonDataChanges(field, options)
      : detectCommonDataChanges;

    const needsValidationUpdate =
      (detectValues &&
        detectValues.some((fieldKey) => compareField(prevState, state, id, fieldKey))) ||
      (detectCommonData && detectCommonData.some((fieldKey) => changedCommonData.has(fieldKey)));

    if (needsValidationUpdate) {
      const validation = validator(field, options);
      // null -> value || oldValue -> null || oldValue -> value
      if (field.get('validation') || validation) {
        updateAcc[validationFieldKey] = { validation };
      }
    }
    return updateAcc;
  }, {}) as { [key: string]: { validation: ValidationObject } };
};

export const getEmptyRequiredFields = (fields) =>
  fields
    .filter((field) => {
      if (isFieldRequired(field) && !field.get('skipValidation')) {
        const value = field.get('value');
        return value ? field.get('binaryUnitValidation') && BinaryUnit[value] : true; // just unit is not good enough
      }
      return false;
    })
    .toArray();

export const getInvalidFields = (fields) =>
  fields
    .filter((field) => field.getIn(['validation', 'type']) === ValidationErrorType.Error)
    .toArray();

export const getInvalidFieldValues = (fields): string[] =>
  fields.map((field) => field.getIn(['value']));

export const getFieldsValidity = (fields) => {
  // check if all required fields are defined
  const emptyRequiredFields = getEmptyRequiredFields(fields);
  let error = describeFields('Please fill in', emptyRequiredFields);
  const hasAllRequiredFilled = emptyRequiredFields.length === 0;

  // check if fields are valid
  const invalidFields = getInvalidFields(fields);
  if (invalidFields.length > 0) {
    error = describeFields('Please correct', invalidFields);
  }
  const isValid = hasAllRequiredFilled && invalidFields.length === 0;

  // check for missing network attachment definition error
  const invalidFieldValues = getInvalidFieldValues(invalidFields);
  if (invalidFieldValues.length === 1 && invalidFieldValues[0] === SELECT_PXE_NAD_ERROR) {
    error = SELECT_PXE_NAD_ERROR_INFO;
  }

  return { error, hasAllRequiredFilled, isValid };
};
