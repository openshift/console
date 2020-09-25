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

export const JSON_SCHEMA_GROUP_TYPES: string[] = ['object', 'array'];
export const JSON_SCHEMA_NUMBER_TYPES: string[] = ['number', 'integer'];

export const THOUSAND = 10 ** 3;
export const MILLION = 10 ** 6;
export const BILLION = 10 ** 9;
