import { ServiceAccountModel } from '@console/internal/models';
import { getJSONSchemaOrder } from '@console/shared/src/components/dynamic-form/utils';
import { SpecCapability } from '../descriptors/types';
import { capabilitiesToUISchema } from './utils';

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
      {
        type: 'object',
        required: ['password', 'select'],
        properties: {
          password: {
            type: 'string',
            minLength: 1,
            maxLength: 25,
            pattern: '^[a-zA-Z0-9._\\-%]*$',
          },
          number: {
            type: 'integer',
            minimum: 2,
            maximum: 4,
          },
          select: {
            type: 'string',
            title: 'Select',
            enum: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'],
          },
          fieldGroup: {
            type: 'object',
            properties: {
              itemOne: {
                type: 'string',
              },
              itemTwo: {
                type: 'integer',
              },
            },
          },
          arrayFieldGroup: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                itemOne: {
                  title: 'Item One',
                  type: 'string',
                },
                itemTwo: {
                  title: 'Item Two',
                  type: 'integer',
                },
              },
            },
          },
          hiddenFieldGroup: {
            type: 'object',
            properties: {
              hiddenItem: {
                type: 'object',
              },
            },
          },
        },
      },
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
      `${SpecCapability.select}DEBUG` as SpecCapability,
      `${SpecCapability.select}INFO` as SpecCapability,
      `${SpecCapability.select}WARN` as SpecCapability,
      `${SpecCapability.select}ERROR` as SpecCapability,
      `${SpecCapability.select}FATAL` as SpecCapability,
    ]);
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
