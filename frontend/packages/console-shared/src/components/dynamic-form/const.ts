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

const SORT_WEIGHT_BASE = 10;
export const SORT_WEIGHT_SCALE_1 = SORT_WEIGHT_BASE ** 1;
export const SORT_WEIGHT_SCALE_2 = SORT_WEIGHT_BASE ** 2;
export const SORT_WEIGHT_SCALE_3 = SORT_WEIGHT_BASE ** 3;
