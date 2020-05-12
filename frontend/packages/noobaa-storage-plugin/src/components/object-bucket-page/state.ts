import { K8sResourceKind } from '@console/internal/module/k8s';

type State = {
  name: string;
  scName: string;
  sizeValue: string;
  sizeUnit: string;
  progress: boolean;
  error: string;
  payload: K8sResourceKind;
  bucketClass: string;
};

export const defaultState = {
  name: '',
  scName: '',
  progress: false,
  error: '',
  payload: {},
  sizeUnit: 'GiB',
  sizeValue: '',
  bucketClass: 'noobaa-default-bucket-class',
};

type Action =
  | { type: 'setName'; name: string }
  | { type: 'setStorage'; name: string }
  | { type: 'setProgress' }
  | { type: 'unsetProgress' }
  | { type: 'setError'; message: string }
  | { type: 'setPayload'; payload: {} }
  | { type: 'setSize'; unit: string; value: string }
  | { type: 'setBucketClass'; name: string };

export const commonReducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'setName':
      return Object.assign({}, state, { name: action.name });
    case 'setStorage':
      return Object.assign({}, state, { scName: action.name });
    case 'setProgress':
      return Object.assign({}, state, { progress: true });
    case 'unsetProgress':
      return Object.assign({}, state, { progress: false });
    case 'setError':
      return Object.assign({}, state, { error: action.message });
    case 'setSize':
      return Object.assign({}, state, { sizeUnit: action.unit, sizeValue: action.value });
    case 'setPayload':
      return Object.assign({}, state, { payload: action.payload });
    case 'setBucketClass':
      return Object.assign({}, state, { bucketClass: action.name });
    default:
      return defaultState;
  }
};
