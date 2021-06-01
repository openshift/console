import { JSONSchema7 } from 'json-schema';
import { JSONSchemaType } from '@console/shared/src/components/dynamic-form';

export const DEFAULT_K8S_SCHEMA: JSONSchema7 = {
  type: JSONSchemaType.object,
  properties: {
    metadata: {
      type: JSONSchemaType.object,
      properties: {
        namespace: { type: JSONSchemaType.string },
        name: {
          type: JSONSchemaType.string,
          default: 'example',
        },
        labels: {
          type: JSONSchemaType.object,
          properties: {},
          additionalProperties: { type: JSONSchemaType.string },
        },
      },
      required: ['name'],
    },
    spec: { type: JSONSchemaType.object },
    apiVersion: { type: JSONSchemaType.string },
    kind: { type: JSONSchemaType.string },
  },
};

export const HIDDEN_UI_SCHEMA = {
  'ui:widget': 'hidden',
  'ui:options': { label: false },
};
