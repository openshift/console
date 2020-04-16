import { JSONSchema6TypeName } from 'json-schema';

export const K8S_UI_SCHEMA = {
  apiVersion: {
    'ui:widget': 'hidden',
    'ui:options': {
      label: false,
    },
  },
  kind: {
    'ui:widget': 'hidden',
    'ui:options': {
      label: false,
    },
  },
  spec: {
    'ui:options': {
      label: false,
    },
  },
  status: {
    'ui:widget': 'hidden',
    'ui:options': {
      label: false,
    },
  },
  'ui:order': ['metadata', 'spec', '*'],
};

export const JSON_SCHEMA_GROUP_TYPES: JSONSchema6TypeName[] = ['object', 'array'];
