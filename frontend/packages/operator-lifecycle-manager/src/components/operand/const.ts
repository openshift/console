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

export const REGEXP_K8S_RESOURCE_CAPABILITY = _.escapeRegExp(SpecCapability.k8sResourcePrefix);
export const REGEXP_FIELD_DEPENDENCY_CAPABILITY = _.escapeRegExp(SpecCapability.fieldDependency);
export const REGEXP_SELECT_CAPABILITY = _.escapeRegExp(SpecCapability.select);

export const REGEXP_K8S_RESOURCE_SUFFIX = new RegExp(
  `^${REGEXP_K8S_RESOURCE_CAPABILITY}(?:core~v1~)?(.*)$`,
);
export const REGEXP_SELECT_OPTION = new RegExp(`${REGEXP_SELECT_CAPABILITY}(.*)$`);
export const REGEXP_FIELD_DEPENDENCY_PATH_VALUE = new RegExp(
  `^${REGEXP_FIELD_DEPENDENCY_CAPABILITY}([^:]*):(.*)$`,
);
export const HIDDEN_UI_SCHEMA = {
  'ui:widget': 'hidden',
  'ui:options': { label: false },
};

const SORT_WEIGHT_BASE = 10;
export const SORT_WEIGHT_SCALE_1 = SORT_WEIGHT_BASE ** 1;
export const SORT_WEIGHT_SCALE_2 = SORT_WEIGHT_BASE ** 2;
export const SORT_WEIGHT_SCALE_3 = SORT_WEIGHT_BASE ** 3;
