import { KMSConfig } from '../types';

export type StorageClassState = {
  encryption: boolean;
  kms: KMSConfig;
};

export enum SCActionType {
  SET_ENCRYPTION = 'SET_ENCRYPTION',
  SET_KMS_ENCRYPTION = 'SET_KMS_ENCRYPTION',
}

export type StorageClassClusterAction =
  | { type: SCActionType.SET_ENCRYPTION; payload: boolean }
  | { type: SCActionType.SET_KMS_ENCRYPTION; payload: KMSConfig };

export const scInitialState: StorageClassState = {
  encryption: false,
  kms: {
    name: {
      value: '',
      valid: true,
    },
    token: {
      value: '',
      valid: true,
    },
    address: {
      value: '',
      valid: true,
    },
    port: {
      value: '',
      valid: true,
    },
    backend: '',
    caCert: null,
    tls: '',
    clientCert: null,
    clientKey: null,
    providerNamespace: '',
    hasHandled: true,
    caCertFile: '',
    clientCertFile: '',
    clientKeyFile: '',
  },
};

export const scReducer = (state: StorageClassState, action: StorageClassClusterAction) => {
  switch (action.type) {
    case SCActionType.SET_ENCRYPTION: {
      return {
        ...state,
        encryption: action.payload,
      };
    }
    case SCActionType.SET_KMS_ENCRYPTION: {
      return {
        ...state,
        kms: action.payload,
      };
    }

    default:
      return state;
  }
};
