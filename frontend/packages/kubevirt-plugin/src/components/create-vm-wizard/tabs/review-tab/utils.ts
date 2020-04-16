import { FormFieldType } from '../../form/form-field';
import { getBooleanReadableValue } from '../../../../utils/strings';
import { iGetFieldValue } from '../../selectors/immutable/field';
import {VMSettingsField} from "../../types";
import {iGet} from "../../../../utils/immutable";

export const getReviewValue = (field: any, fieldType: FormFieldType) => {
  const value = iGetFieldValue(field);

  return [FormFieldType.CHECKBOX, FormFieldType.INLINE_CHECKBOX].includes(fieldType)
    ? getBooleanReadableValue(value)
    : value;
};

export const getField = (key: VMSettingsField, vmSettings) => iGet(vmSettings, key);
