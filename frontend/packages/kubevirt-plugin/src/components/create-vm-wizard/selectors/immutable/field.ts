import { hasTruthyValue, iGet } from '../../../../utils/immutable';

export const iGetFieldValue = (field, defaultValue = undefined) =>
  iGet(field, 'value', defaultValue);
export const iGetFieldKey = (field, defaultValue = undefined) => iGet(field, 'key', defaultValue);

export const isFieldRequired = (field) => hasTruthyValue(iGet(field, 'isRequired'));
export const isFieldHidden = (field) => hasTruthyValue(iGet(field, 'isHidden'));
export const isFieldDisabled = (field) => hasTruthyValue(iGet(field, 'isDisabled'));
