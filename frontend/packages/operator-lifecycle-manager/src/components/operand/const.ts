import { JSONSchema6 } from 'json-schema';
import { JSONSchemaType } from '@console/shared/src/components/dynamic-form';

export const YAML_HELP_TEXT =
  'Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor.';
export const FORM_HELP_TEXT =
  'Create by completing the form. Default values may be provided by the Operator authors.';
export const DEFAULT_K8S_SCHEMA: JSONSchema6 = {
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
