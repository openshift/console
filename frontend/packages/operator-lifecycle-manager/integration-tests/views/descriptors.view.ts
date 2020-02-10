import { SpecCapability } from '../../src/components/descriptors/types';

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
