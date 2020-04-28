import { SpecCapability } from '../../src/components/descriptors/types';
import { $, $$, browser, ExpectedConditions as until } from 'protractor';

export const ARRAY_FIELD_GROUP_ID = '#root_spec_arrayFieldGroup';
export const FIELD_GROUP_ID = '#root_spec_fieldGroup';
export const HIDDEN_FIELD_ID = '#root_spec_hiddenFieldGroup';
export const LABELS_FIELD_ID = '#root_metadata_labels';
export const NAME_FIELD_ID = '#root_metadata_name';
export const NUMBER_FIELD_ID = '#root_spec_number';
export const PASSWORD_FIELD_ID = '#root_spec_password';
export const SELECT_FIELD_ID = '#root_spec_select';

export const atomicFields = [
  {
    label: 'Name',
    path: 'metadata.name',
    id: NAME_FIELD_ID,
  },
  {
    label: 'Password',
    path: 'spec.password',
    id: PASSWORD_FIELD_ID,
  },
  {
    label: 'Number',
    path: 'spec.number',
    id: NUMBER_FIELD_ID,
  },
];

export const formGroups = $$('.co-dynamic-form .form-group');
export const formFieldIsPresent = async (id) => browser.wait(until.presenceOf($(id)));

export const getOperandFormField = (id) => ({
  element: $(`${id}_field`),
  label: $(`${id}_field .form-label`),
  input: $(id),
});

export const getOperandFormFieldGroup = (id) => ({
  element: $(`${id}_field-group`),
  label: $(`${id}_field-group .pf-c-accordion__toggle-text`),
  toggleButton: $(`button${id}_accordion-toggle`),
});

export const getOperandFormArrayFieldGroup = (id) => ({
  element: $(`${id}_field-group`),
  label: $(`${id}_field-group .pf-c-accordion__toggle-text`),
  toggleButton: $(`button${id}_accordion-toggle`),
  addButton: $(`${id}`),
});

export const inputValueFor = (capability: SpecCapability) => async (el: any) => {
  switch (capability) {
    case SpecCapability.podCount:
      return parseInt(await el.$('input').getAttribute('value'), 10);
    case SpecCapability.label:
      return el.$('input').getAttribute('value');
    case SpecCapability.resourceRequirements:
      return {
        limits: {
          cpu: await el
            .$$('input')
            .get(0)
            .getAttribute('value'),
          memory: await el
            .$$('input')
            .get(1)
            .getAttribute('value'),
          'ephemeral-storage': await el
            .$$('input')
            .get(2)
            .getAttribute('value'),
        },
        requests: {
          cpu: await el
            .$$('input')
            .get(3)
            .getAttribute('value'),
          memory: await el
            .$$('input')
            .get(4)
            .getAttribute('value'),
          'ephemeral-storage': await el
            .$$('input')
            .get(5)
            .getAttribute('value'),
        },
      };
    case SpecCapability.booleanSwitch:
      return (await el.$$('.pf-c-switch__input').getAttribute('checked')) !== 'false';
    case SpecCapability.password:
      return el.$('input').getAttribute('value');
    case SpecCapability.checkbox:
      return (await el.$('input').getAttribute('checked')) !== 'false';
    case SpecCapability.imagePullPolicy:
      return el.$("input[type='radio']:checked").getAttribute('value');
    case SpecCapability.updateStrategy:
      return { type: await el.$("input[type='radio']:checked").getAttribute('value') };
    case SpecCapability.text:
      return el.$('input').getAttribute('value');
    case SpecCapability.number:
      return parseInt(await el.$('input').getAttribute('value'), 10);
    case SpecCapability.endpointList:
    case SpecCapability.namespaceSelector:
    case SpecCapability.nodeAffinity:
    case SpecCapability.podAffinity:
    case SpecCapability.podAntiAffinity:
    default:
      return null;
  }
};
