import { AWS_REGIONS } from '../../constants/providers';
import { ProviderDataState, StoreAction } from '../namespace-store/reducer';

export type BackingStoreProviderDataState = ProviderDataState & {
  numVolumes: number;
  gcpJSON: string;
  volumeSize: string;
  storageClass: string;
};

export type BackingStoreAction =
  | StoreAction
  | { type: 'setGcpJSON'; value: string }
  | { type: 'setVolumes'; value: number }
  | { type: 'setVolumeSize'; value: string }
  | { type: 'setStorageClass'; value: string };

export const initialState: BackingStoreProviderDataState = {
  secretName: '',
  secretNamespace: '',
  secretKey: '',
  accessKey: '',
  region: AWS_REGIONS[0],
  gcpJSON: '',
  target: '',
  endpoint: '',
  numVolumes: 1,
  volumeSize: '50Gi',
  storageClass: '',
};

export const providerDataReducer = (
  state: BackingStoreProviderDataState,
  action: BackingStoreAction,
) => {
  const { value } = action;
  switch (action.type) {
    case 'setSecretName':
      return Object.assign({}, state, { secretName: value });
    case 'setSecretNamespace':
      return Object.assign({}, state, { secretNamespace: value });
    case 'setSecretKey':
      return Object.assign({}, state, { secretKey: value });
    case 'setAccessKey':
      return Object.assign({}, state, { accessKey: value });
    case 'setRegion':
      return Object.assign({}, state, { region: value });
    case 'setGcpJSON':
      return Object.assign({}, state, { gcpJSON: value });
    case 'setTarget':
      return Object.assign({}, state, { target: value });
    case 'setEndpoint':
      return Object.assign({}, state, { endpoint: value });
    case 'setVolumes':
      return Object.assign({}, state, { numVolumes: value });
    case 'setVolumeSize':
      return Object.assign({}, state, { volumeSize: value });
    case 'setStorageClass':
      return Object.assign({}, state, { storageClass: value });
    default:
      return initialState;
  }
};
