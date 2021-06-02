import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash';
import { ValidationErrorType, ValidationObject } from '@console/shared';
import { BinaryUnit } from '../../../form/size-unit-utils';
import { iGetFieldKey, isFieldRequired } from '../../selectors/immutable/field';
import { SettingsFieldType } from '../../types';
import { getFieldTitleKey, sortFields } from '../../utils/renderable-field-utils';
import { UpdateOptions, Validation, ValidationConfig } from '../types';

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

export const getFieldsValidity = (fields): Validation => {
  const invalidFields = getInvalidFields(fields);
  const emptyRequiredFields = getEmptyRequiredFields(fields);
  let errorKey: string;
  let fieldKeys: string[];
  let isValid = true;
  let hasAllRequiredFilled = true;
  if (invalidFields.length > 0) {
    isValid = false;
    // t('kubevirt-plugin~Please correct the following fields:')
    // t('kubevirt-plugin~Please correct the following field:')
    errorKey =
      invalidFields.length > 1
        ? 'kubevirt-plugin~Please correct the following fields:'
        : 'kubevirt-plugin~Please correct the following field:';
    fieldKeys = _.compact(
      sortFields(invalidFields).map((field) => getFieldTitleKey(iGetFieldKey(field))),
    );
  } else if (emptyRequiredFields.length > 0) {
    hasAllRequiredFilled = false;
    isValid = false;
    // t('kubevirt-plugin~Please fill in the following fields:')
    // t('kubevirt-plugin~Please fill in the following field:')
    errorKey =
      emptyRequiredFields.length > 1
        ? 'kubevirt-plugin~Please fill in the following fields:'
        : 'kubevirt-plugin~Please fill in the following field:';
    fieldKeys = _.compact(
      sortFields(emptyRequiredFields).map((field) => getFieldTitleKey(iGetFieldKey(field))),
    );
  }

  return { errorKey, fieldKeys, hasAllRequiredFilled, isValid };
};
