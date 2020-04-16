import * as _ from 'lodash';
import { JSONSchema6 } from 'json-schema';
import { SpecCapability } from '../descriptors/types';
import { SchemaType } from '@console/shared/src/components/dynamic-form';

export const YAML_HELP_TEXT =
  'Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor.';
export const FORM_HELP_TEXT =
  'Create by completing the form. Default values may be provided by the Operator authors.';
export const DEFAULT_K8S_SCHEMA: JSONSchema6 = {
  type: SchemaType.object,
  properties: {
    metadata: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
        },
        name: {
          type: 'string',
          default: 'example',
        },
        labels: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['name'],
    },
    spec: { type: SchemaType.object },
    apiVersion: { type: SchemaType.string },
    kind: { type: SchemaType.string },
  },
};

export const K8S_RESOURCE_CAPABILITY_PATTERN = _.escapeRegExp(SpecCapability.k8sResourcePrefix);
export const K8S_RESOURCE_SUFFIX_MATCH_PATTERN = new RegExp(
  `^${K8S_RESOURCE_CAPABILITY_PATTERN}(?:core~v1~)?(.*)$`,
);
export const SELECT_CAPABILITY_PATTERN = _.escapeRegExp(SpecCapability.select);
export const SELECT_OPTION_MATCH_PATTERN = new RegExp(`${SELECT_CAPABILITY_PATTERN}(.*)$`);
export const HIDDEN_UI_SCHEMA = {
  'ui:widget': 'hidden',
  'ui:options': { label: false },
};
