import { StorageClassResourceKind, NodeKind } from '@console/internal/module/k8s';
import { EncryptionType, KMSConfig, NetworkType } from '../../../types';
import { defaultRequestSize, KMSEmptyState } from '../../../constants';

export type InternalClusterState = {
  storageClass: StorageClassResourceKind;
  capacity: string;
  nodes: NodeKind[];
  enableMinimal: boolean;
  enableFlexibleScaling: boolean;
  enableTaint: boolean;
  // Encryption state declare
  encryption: EncryptionType;
  kms: KMSConfig;
  publicNetwork: string;
  clusterNetwork: string;
  networkType: NetworkType;
};

export enum ActionType {
  SET_STORAGE_CLASS = 'SET_STORAGE_CLASS',
  SET_CAPACITY = 'SET_CAPACITY',
  SET_NODES = 'SET_NODES',
  SET_ENABLE_MINIMAL = 'SET_ENABLE_MINIMAL',
  SET_ENABLE_FLEXIBLE_SCALING = 'SET_ENABLE_FLEXIBLE_SCALING',
  SET_ENABLE_TAINT = 'SET_ENABLE_TAINT',
  // Encryption state actions
  SET_ENABLE_ENCRYPTION = 'SET_ENABLE_ENCRYPTION',
  SET_ENCRYPTION = 'SET_ENCRYPTION',
  SET_KMS_ENCRYPTION = 'SET_KMS_ENCRYPTION',
  CLEAR_KMS_STATE = 'CLEAR_KMS_STATE',
  // Network state actions
  SET_NETWORK_TYPE = 'SET_NETWORK_TYPE',
  SET_PUBLIC_NETWORK = 'SET_PUBLIC_NETWORK',
  SET_CLUSTER_NETWORK = 'SET_CLUSTER_NETWORK',
}

export type InternalClusterAction =
  | { type: ActionType.SET_STORAGE_CLASS; payload: StorageClassResourceKind }
  | { type: ActionType.SET_CAPACITY; payload: string }
  | { type: ActionType.SET_NODES; payload: NodeKind[] }
  | { type: ActionType.SET_ENABLE_MINIMAL; payload: boolean }
  | { type: ActionType.SET_ENABLE_FLEXIBLE_SCALING; payload: boolean }
  | { type: ActionType.SET_ENABLE_TAINT; payload: boolean }
  // Encryption actions
  | { type: ActionType.SET_ENCRYPTION; payload: EncryptionType }
  // KMS action
  | { type: ActionType.SET_KMS_ENCRYPTION; payload: KMSConfig }
  | { type: ActionType.CLEAR_KMS_STATE }
  | { type: ActionType.SET_ENABLE_ENCRYPTION; payload: boolean }
  | { type: ActionType.SET_ENABLE_MINIMAL; payload: boolean }
  | { type: ActionType.SET_NETWORK_TYPE; payload: NetworkType }
  | { type: ActionType.SET_CLUSTER_NETWORK; payload: string }
  | { type: ActionType.SET_PUBLIC_NETWORK; payload: string };

export const initialState: InternalClusterState = {
  storageClass: { provisioner: '', reclaimPolicy: '' },
  capacity: defaultRequestSize.NON_BAREMETAL,
  nodes: [],
  enableMinimal: false,
  enableFlexibleScaling: false,
  enableTaint: false,
  // Encryption state initialization
  encryption: {
    clusterWide: false,
    storageClass: false,
    advanced: false,
    hasHandled: true,
  },
  // KMS object state
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
  publicNetwork: null,
  clusterNetwork: null,
  networkType: NetworkType.DEFAULT,
};

export const reducer = (state: InternalClusterState, action: InternalClusterAction) => {
  switch (action.type) {
    case ActionType.SET_STORAGE_CLASS: {
      return {
        ...state,
        storageClass: action.payload,
      };
    }
    case ActionType.SET_CAPACITY: {
      return {
        ...state,
        capacity: action.payload,
      };
    }
    case ActionType.SET_NODES: {
      return {
        ...state,
        nodes: action.payload,
      };
    }
    case ActionType.SET_ENABLE_MINIMAL: {
      return {
        ...state,
        enableMinimal: action.payload,
      };
    }
    case ActionType.SET_ENABLE_FLEXIBLE_SCALING: {
      return {
        ...state,
        enableFlexibleScaling: action.payload,
      };
    }
    case ActionType.SET_ENABLE_TAINT: {
      return {
        ...state,
        enableTaint: action.payload,
      };
    }
    // Encryption state reducer
    case ActionType.SET_ENCRYPTION: {
      return {
        ...state,
        encryption: action.payload,
      };
    }
    // KMS reducer
    case ActionType.SET_KMS_ENCRYPTION: {
      return {
        ...state,
        kms: action.payload,
      };
    }

    case ActionType.SET_NETWORK_TYPE: {
      return {
        ...state,
        networkType: action.payload,
      };
    }
    case ActionType.SET_CLUSTER_NETWORK: {
      return {
        ...state,
        clusterNetwork: action.payload,
      };
    }
    case ActionType.SET_PUBLIC_NETWORK: {
      return {
        ...state,
        publicNetwork: action.payload,
      };
    }
    case ActionType.CLEAR_KMS_STATE: {
      return {
        ...state,
        kms: { ...KMSEmptyState },
      };
    }
    default:
      return state;
  }
};
