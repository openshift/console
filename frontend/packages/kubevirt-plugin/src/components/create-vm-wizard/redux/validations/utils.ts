import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash';
import { ValidationObject } from '@console/shared';
import { UpdateOptions, VMSettingsValidationConfig } from '../types';
import { VMSettingsFieldType } from '../../types';

export const getValidationUpdate = (
  config: VMSettingsValidationConfig,
  options: UpdateOptions,
  fields: ImmutableMap<string, VMSettingsFieldType>,
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
