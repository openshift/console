import { Map as ImmutableMap } from 'immutable';
import { CUSTOM_FLAVOR } from '../../../../constants';
import { iGetRelevantTemplate } from '../../../../selectors/immutable/template/combined';
import { isCustomFlavor } from '../../../../selectors/vm-like/flavor';
import { getTemplateFlavorData } from '../../../../selectors/vm-template/advanced';
import { ITemplate } from '../../../../types/template';
import { iGet, iGetIn, toShallowJS } from '../../../../utils/immutable';
import { getBooleanReadableValue } from '../../../../utils/strings';
import { FormFieldType } from '../../form/form-field';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { VMSettingsField } from '../../types';

export const getReviewValue = (field: any, fieldType: FormFieldType) => {
  const value = iGetFieldValue(field);

  return [FormFieldType.CHECKBOX, FormFieldType.INLINE_CHECKBOX].includes(fieldType)
    ? getBooleanReadableValue(value)
    : value;
};

export const getField = (key: VMSettingsField, vmSettings) => iGet(vmSettings, key);

export const getFieldValue = (vmSettings, key: VMSettingsField) =>
  iGetIn(vmSettings, [key, 'value']);

export const getVMFlavorData = ({
  iVMSettings,
  iUserTemplate,
  iCommonTemplates,
  relevantOptions,
}: GetFlavorValueParams) => {
  const flavor = getFieldValue(iVMSettings, VMSettingsField.FLAVOR);

  if (isCustomFlavor(flavor)) {
    return {
      flavor: CUSTOM_FLAVOR,
      memory: getFieldValue(iVMSettings, VMSettingsField.MEMORY),
      count: parseInt(getFieldValue(iVMSettings, VMSettingsField.CPU), 10),
    };
  }

  const template = toShallowJS(
    +iUserTemplate || iGetRelevantTemplate(iCommonTemplates, relevantOptions),
  );
  return getTemplateFlavorData(template);
};

type GetFlavorValueParams = {
  iVMSettings: any;
  iUserTemplate: ITemplate;
  iCommonTemplates: ImmutableMap<string, ITemplate>;
  relevantOptions: any;
};
