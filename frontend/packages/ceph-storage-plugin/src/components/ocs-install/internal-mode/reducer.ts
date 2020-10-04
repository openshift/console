import { defaultRequestSize } from '../../../constants';
import { StorageClassResourceKind, NodeKind } from '@console/internal/module/k8s';

export type InternalClusterState = {
  storageClass: StorageClassResourceKind;
  capacity: string;
  nodes: NodeKind[];
  enableEncryption: boolean;
  enableMinimal: boolean;
};

export enum ActionType {
  SET_STORAGE_CLASS = 'SET_STORAGE_CLASS',
  SET_CAPACITY = 'SET_CAPACITY',
  SET_NODES = 'SET_NODES',
  SET_ENABLE_ENCRYPTION = 'SET_ENABLE_ENCRYPTION',
  SET_ENABLE_MINIMAL = 'SET_ENABLE_MINIMAL',
}

export type InternalClusterAction =
  | { type: ActionType.SET_STORAGE_CLASS; payload: StorageClassResourceKind }
  | { type: ActionType.SET_CAPACITY; payload: string }
  | { type: ActionType.SET_NODES; payload: NodeKind[] }
  | { type: ActionType.SET_ENABLE_ENCRYPTION; payload: boolean }
  | { type: ActionType.SET_ENABLE_MINIMAL; payload: boolean };

export const initialState: InternalClusterState = {
  storageClass: { provisioner: '', reclaimPolicy: '' },
  capacity: defaultRequestSize.NON_BAREMETAL,
  nodes: [],
  enableEncryption: false,
  enableMinimal: false,
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
    case ActionType.SET_ENABLE_ENCRYPTION: {
      return {
        ...state,
        enableEncryption: action.payload,
      };
    }
    case ActionType.SET_ENABLE_MINIMAL: {
      return {
        ...state,
        enableMinimal: action.payload,
      };
    }
    default:
      return state;
  }
};
