import { testCRD } from '../../../integration-tests/mocks';
import {
  getJSONSchemaOrder,
  capabilitiesToUISchema,
  getDefaultUISchema,
  hasNoFields,
} from './utils';
import { ServiceAccountModel } from '@console/internal/models';
import { SpecCapability } from '../descriptors/types';
import { JSONSchema6 } from 'json-schema';
import { SchemaType } from '@console/shared/src/components/dynamic-form';
import { HIDDEN_UI_SCHEMA } from './const';

describe('getJSONSchemaOrder', () => {
  it('Accurately converts descriptors to a uiSchema with correct "ui:order" properties:', () => {
    const testUISchema = {
      select: {
        'ui:descriptor': true,
      },
      number: {
        'ui:descriptor': true,
      },
      fieldGroup: {
        itemTwo: {
          'ui:descriptor': true,
        },
      },
      arrayFieldGroup: {
        items: {
          itemTwo: {
            'ui:descriptor': true,
          },
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

describe('hasNoFields', () => {
  it('Applies hidden widget and label properties to empty schemas', () => {
    const schema: JSONSchema6 = {
      type: 'object',
      properties: {
        shown: {
          type: 'object',
          properties: {
            test: { type: 'string' },
          },
        },
        hidden: {
          type: 'object',
          properties: {
            emptyArray: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  empty: { type: 'object' },
                },
              },
            },
            emptyObject: {
              type: 'object',
            },
          },
        },
      },
    };
    expect(hasNoFields(schema.properties.shown as JSONSchema6)).toBeFalsy();
    expect(hasNoFields(schema.properties.hidden as JSONSchema6)).toBeTruthy();
  });
});

describe('getDefaultUISchema', () => {
  it('Creates correct default ui schema based on property names', () => {
    const schema = {
      type: SchemaType.object,
      properties: {
        resources: { type: SchemaType.string },
        installPlan: { type: SchemaType.string },
        imagePullPolicy: { type: SchemaType.string },
        updateStrategy: { type: SchemaType.string },
        nodeAffinity: { type: SchemaType.string },
        podAffinity: { type: SchemaType.string },
        podAntiAffinity: { type: SchemaType.string },
        replicas: { type: SchemaType.string },
        matchExpressions: { type: SchemaType.string },
      },
    };
    const uiSchema = getDefaultUISchema(schema);
    expect(uiSchema.resources).toEqual({
      'ui:field': 'ResourceRequirementsField',
      'ui:title': 'Resource Requirements',
    });
    expect(uiSchema.installPlan).toEqual({
      'ui:field': 'InstallPlanField',
      'ui:title': 'Install Plan',
    });
    expect(uiSchema.imagePullPolicy).toEqual({
      'ui:widget': 'ImagePullPolicyWidget',
      'ui:title': 'Image Pull Policy',
    });
    expect(uiSchema.updateStrategy).toEqual({
      'ui:field': 'UpdateStrategyField',
      'ui:title': 'Update Strategy',
    });
    expect(uiSchema.nodeAffinity).toEqual({
      'ui:field': 'NodeAffinityField',
      'ui:title': 'Node Affinity',
    });
    expect(uiSchema.podAffinity).toEqual({
      'ui:field': 'PodAffinityField',
      'ui:title': 'Pod Affinity',
    });
    expect(uiSchema.podAntiAffinity).toEqual({
      'ui:field': 'PodAffinityField',
      'ui:title': 'Pod Anti-Affinity',
    });
    expect(uiSchema.replicas).toEqual({ 'ui:widget': 'PodCountWidget', 'ui:title': 'Replicas' });
    expect(uiSchema.matchExpressions).toEqual({
      'ui:field': 'MatchExpressionsField',
      'ui:title': 'Match Expressions',
    });
  });

  it('Creates correct ui schema for empty schema property', () => {
    const uiSchema = getDefaultUISchema(testCRD.spec.validation.openAPIV3Schema as JSONSchema6);
    expect(uiSchema.spec.hiddenFieldGroup).toEqual(HIDDEN_UI_SCHEMA);
  });
});
