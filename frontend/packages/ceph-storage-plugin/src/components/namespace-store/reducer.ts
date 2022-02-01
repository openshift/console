import { AWS_REGIONS } from '../../constants/providers';

export type StoreAction =
  | { type: 'setSecretName'; value: string }
  | { type: 'setSecretNamespace'; value: string }
  | { type: 'setSecretKey'; value: string }
  | { type: 'setAccessKey'; value: string }
  | { type: 'setRegion'; value: string }
  | { type: 'setTarget'; value: string }
  | { type: 'setEndpoint'; value: string };

export type ProviderDataState = {
  secretName: string;
  secretNamespace: string;
  secretKey: string;
  accessKey: string;
  region: string;
  target: string;
  endpoint: string;
};

export const initialState: ProviderDataState = {
  secretName: '',
  secretNamespace: '',
  secretKey: '',
  accessKey: '',
  region: AWS_REGIONS[0],
  target: '',
  endpoint: '',
};

export const providerDataReducer = (state: ProviderDataState, action: StoreAction) => {
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
    case 'setTarget':
      return Object.assign({}, state, { target: value });
    case 'setEndpoint':
      return Object.assign({}, state, { endpoint: value });
    default:
      return initialState;
  }
};
