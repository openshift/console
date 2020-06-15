import { JSONSchema6 } from 'json-schema';
import { SchemaType } from '@console/shared/src/components/dynamic-form';

export const YAML_HELP_TEXT =
  'Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor.';
export const FORM_HELP_TEXT =
  'Create by completing the form. Default values may be provided by the Operator authors.';
export const DEFAULT_K8S_SCHEMA: JSONSchema6 = {
  type: SchemaType.object,
  properties: {
    metadata: {
      type: SchemaType.object,
      properties: {
        namespace: { type: SchemaType.string },
        name: {
          type: SchemaType.string,
          default: 'example',
        },
        labels: {
          type: SchemaType.object,
          properties: {},
          additionalProperties: { type: SchemaType.string },
        },
      },
      required: ['name'],
    },
    spec: { type: SchemaType.object },
    apiVersion: { type: SchemaType.string },
    kind: { type: SchemaType.string },
  },
};

export const HIDDEN_UI_SCHEMA = {
  'ui:widget': 'hidden',
  'ui:options': { label: false },
};

const SORT_WEIGHT_BASE = 10;
export const SORT_WEIGHT_SCALE_1 = SORT_WEIGHT_BASE ** 1;
export const SORT_WEIGHT_SCALE_2 = SORT_WEIGHT_BASE ** 2;
export const SORT_WEIGHT_SCALE_3 = SORT_WEIGHT_BASE ** 3;
