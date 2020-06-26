import { testCRD } from '../../../integration-tests/mocks';
import { getJSONSchemaOrder } from '@console/shared/src/components/dynamic-form/utils';
import { ServiceAccountModel } from '@console/internal/models';
import { capabilitiesToUISchema } from './utils';
import { SpecCapability } from '../descriptors/types';

describe('getJSONSchemaOrder', () => {
  it('Accurately converts descriptors to a uiSchema with correct "ui:order" properties:', () => {
    const testUISchema = {
      select: { 'ui:descriptor': true },
      number: { 'ui:descriptor': true },
      fieldGroup: {
        itemTwo: { 'ui:descriptor': true },
      },
      arrayFieldGroup: {
        items: {
          itemTwo: { 'ui:descriptor': true },
        },
      },
    };
    const uiOrder = getJSONSchemaOrder(
      testCRD.spec.validation.openAPIV3Schema.properties.spec,
      testUISchema,
    );
    expect(uiOrder['ui:order']).toEqual([
      'select',
      'password',
      'number',
      'fieldGroup',
      'arrayFieldGroup',
      'hiddenFieldGroup',
    ]);
    expect(uiOrder.fieldGroup['ui:order']).toEqual(['itemTwo', 'itemOne']);
    expect(uiOrder.arrayFieldGroup.items['ui:order']).toEqual(['itemTwo', 'itemOne']);
  });
});

describe('capabilitiesToUISchema', () => {
  it('Handles SpecCapability.k8sResourcePrefix', () => {
    const uiSchema = capabilitiesToUISchema([
      `${SpecCapability.k8sResourcePrefix}ServiceAccount` as SpecCapability,
    ]);
    expect(uiSchema['ui:widget']).toEqual('K8sResourceWidget');
    expect(uiSchema['ui:options'].model).toEqual(ServiceAccountModel);
    expect(uiSchema['ui:options'].groupVersionKind).toEqual('ServiceAccount');
  });
  it('Handles SpecCapablitiy.select', () => {
    const uiSchema = capabilitiesToUISchema([
      `${SpecCapability.select}DEBUG`,
      `${SpecCapability.select}INFO`,
      `${SpecCapability.select}WARN`,
      `${SpecCapability.select}ERROR`,
      `${SpecCapability.select}FATAL`,
    ] as SpecCapability[]);
    expect(uiSchema['ui:items']).toEqual({
      DEBUG: 'DEBUG',
      INFO: 'INFO',
      WARN: 'WARN',
      ERROR: 'ERROR',
      FATAL: 'FATAL',
    });
    expect(uiSchema['ui:field']).toEqual('DropdownField');
  });
});
