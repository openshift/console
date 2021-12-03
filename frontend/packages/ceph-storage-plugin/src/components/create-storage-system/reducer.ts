import * as _ from 'lodash';
import {
  deviceTypeDropdownItems,
  diskModeDropdownItems,
} from '@console/local-storage-operator-plugin/src/constants';
import { NodeKind } from '@console/internal/module/k8s';
import { ExternalState, ExternalStateKeys, ExternalStateValues } from './external-storage/types';
import { BackingStorageType, DeploymentType } from '../../constants/create-storage-system';
import { EncryptionType, KMSConfig, NetworkType } from '../../types';
import { KMSEmptyState, NO_PROVISIONER } from '../../constants';

export type WizardState = CreateStorageSystemState;
export type WizardDispatch = React.Dispatch<CreateStorageSystemAction>;

export type WizardCommonProps = {
  state: WizardState;
  dispatch: WizardDispatch;
};

/* State of CreateStorageSystem */
export const initialState: CreateStorageSystemState = {
  stepIdReached: 1,
  storageClass: { name: '', provisioner: '' },
  nodes: [],
  backingStorage: {
    type: BackingStorageType.EXISTING,
    externalStorage: '',
    deployment: DeploymentType.FULL,
  },
  capacityAndNodes: {
    enableArbiter: false,
    enableTaint: false,
    arbiterLocation: '',
    capacity: null,
    pvCount: 0,
  },
  createStorageClass: {},
  connectionDetails: {},
  createLocalVolumeSet: {
    volumeSetName: '',
    isValidDiskSize: true,
    diskType: 'All',
    diskMode: diskModeDropdownItems.BLOCK,
    deviceType: [deviceTypeDropdownItems.DISK, deviceTypeDropdownItems.PART],
    maxDiskLimit: '',
    minDiskSize: '1',
    maxDiskSize: '',
    diskSizeUnit: 'Gi',
    isValidMaxSize: true,
    showConfirmModal: false,
    chartNodes: new Set(),
  },
  securityAndNetwork: {
    encryption: {
      clusterWide: false,
      storageClass: false,
      advanced: false,
      hasHandled: true,
    },
    kms: KMSEmptyState,
    publicNetwork: null,
    clusterNetwork: null,
    networkType: NetworkType.DEFAULT,
  },
};

type CreateStorageSystemState = {
  stepIdReached: number;
  storageClass: { name: string; provisioner?: string };
  nodes: WizardNodeState[];
  backingStorage: {
    type: BackingStorageType;
    externalStorage: string;
    deployment: DeploymentType;
  };
  createStorageClass: ExternalState;
  connectionDetails: ExternalState;
  capacityAndNodes: {
    enableArbiter: boolean;
    enableTaint: boolean;
    arbiterLocation: string;
    // @TODO: Remove union types and use "number" as type.
    // Requires refactoring osd size dropdown.
    capacity: string | number;
    pvCount: number;
  };
  securityAndNetwork: {
    encryption: EncryptionType;
    kms: KMSConfig;
    publicNetwork: string;
    clusterNetwork: string;
    networkType: NetworkType;
  };
  createLocalVolumeSet: LocalVolumeSet;
};

export type WizardNodeState = {
  name: string;
  hostName: string;
  cpu: string;
  memory: string;
  zone: string;
  uid: string;
  roles: string[];
  labels: NodeKind['metadata']['labels'];
  taints: NodeKind['spec']['taints'];
};

export type LocalVolumeSet = {
  volumeSetName: string;
  isValidDiskSize: boolean;
  diskType: string;
  diskMode: string;
  deviceType: string[];
  maxDiskLimit: string;
  minDiskSize: string;
  maxDiskSize: string;
  diskSizeUnit: string;
  isValidMaxSize: boolean;
  showConfirmModal: boolean;
  chartNodes: Set<string>;
};

const setDeployment = (state: WizardState, deploymentType: DeploymentType) => {
  /*
   * Wizard state should be reset when a new deployment type is selected
   * in order to avoid stale state collisions since each deployment mode
   * has its own supported configuration.
   *
   * Its not required if the user has not visited more than first step.
   */
  if (state.stepIdReached !== 1) {
    const { type } = state.backingStorage;
    return {
      ...initialState,
      storageClass:
        type === BackingStorageType.EXISTING ? state.storageClass : initialState.storageClass,
      backingStorage: {
        ...state.backingStorage,
        deployment: deploymentType,
      },
    };
  }

  state.backingStorage.deployment = deploymentType;
  return state;
};

const setBackingStorageType = (state: WizardState, bsType: BackingStorageType) => {
  /*
   * Wizard state should be reset when a new backing storage type is selected
   * in order to avoid stale state collisions since each backing storage type
   * has its own supported variables. e.g if arbiter was selected and not
   * deselected before changing the backing storage type then storage cluster spec
   * will mark the arbiter option as enabled.
   *
   * Its not required if the user has not visited more than first step.
   */
  if (state.stepIdReached !== 1) {
    return {
      ...initialState,
      backingStorage: {
        ...state.backingStorage,
        type: bsType,
      },
    };
  }

  /* Update storage class state when existing storage class is not selected. */
  if (bsType === BackingStorageType.LOCAL_DEVICES || bsType === BackingStorageType.EXTERNAL) {
    state.storageClass = {
      name: '',
      provisioner: bsType === BackingStorageType.EXTERNAL ? '' : NO_PROVISIONER,
    };
  }

  /* Reset external storage when deselected. */
  if (bsType !== BackingStorageType.EXTERNAL) {
    state.backingStorage.externalStorage = initialState.backingStorage.externalStorage;
  }

  state.backingStorage.type = bsType;
  return state;
};

/* Reducer of CreateStorageSystem */
export const reducer: WizardReducer = (prevState, action) => {
  const newState: WizardState = _.cloneDeep(prevState);
  switch (action.type) {
    case 'wizard/setStepIdReached':
      newState.stepIdReached = action.payload;
      break;
    case 'wizard/setStorageClass':
      newState.storageClass = {
        name: action.payload.name,
        provisioner: action.payload?.provisioner,
      };
      break;
    case 'wizard/setNodes':
      newState.nodes = action.payload;
      break;
    case 'wizard/setCreateStorageClass':
      newState.createStorageClass = {
        ...newState.createStorageClass,
        [action.payload.field]: action.payload.value,
      };
      break;
    case 'wizard/setConnectionDetails':
      newState.connectionDetails = {
        ...newState.connectionDetails,
        [action.payload.field]: action.payload.value,
      };
      break;
    case 'wizard/setCreateLocalVolumeSet':
      newState.createLocalVolumeSet = {
        ...newState.createLocalVolumeSet,
        [action.payload.field]: action.payload.value,
      };
      break;
    case 'backingStorage/setType':
      return setBackingStorageType(newState, action.payload);
    case 'backingStorage/setDeployment':
      return setDeployment(newState, action.payload);
    case 'backingStorage/setExternalStorage':
      newState.backingStorage.externalStorage = action.payload;
      break;
    case 'capacityAndNodes/capacity':
      newState.capacityAndNodes.capacity = action.payload;
      break;
    case 'capacityAndNodes/pvCount':
      newState.capacityAndNodes.pvCount = action.payload;
      break;
    case 'capacityAndNodes/arbiterLocation':
      newState.capacityAndNodes.arbiterLocation = action.payload;
      break;
    case 'capacityAndNodes/enableArbiter':
      newState.capacityAndNodes.enableArbiter = action.payload;
      break;
    case 'capacityAndNodes/enableTaint':
      newState.capacityAndNodes.enableTaint = action.payload;
      break;
    case 'securityAndNetwork/setKms':
      newState.securityAndNetwork.kms = action.payload;
      break;
    case 'securityAndNetwork/setVault':
      newState.securityAndNetwork.kms.vault = action.payload;
      break;
    case 'securityAndNetwork/setHpcs':
      newState.securityAndNetwork.kms.hpcs = action.payload;
      break;
    case 'securityAndNetwork/setKmsProvider':
      newState.securityAndNetwork.kms.kmsProvider = action.payload;
      break;
    case 'securityAndNetwork/setEncryption':
      newState.securityAndNetwork.encryption = action.payload;
      break;
    case 'securityAndNetwork/setClusterNetwork':
      newState.securityAndNetwork.clusterNetwork = action.payload;
      break;
    case 'securityAndNetwork/setPublicNetwork':
      newState.securityAndNetwork.publicNetwork = action.payload;
      break;
    case 'securityAndNetwork/setNetworkType':
      newState.securityAndNetwork.networkType = action.payload;
      break;

    default:
      throw new TypeError(`${action} is not a valid reducer action`);
  }
  return newState;
};

export type WizardReducer = (
  prevState: CreateStorageSystemState,
  action: CreateStorageSystemAction,
) => CreateStorageSystemState;

/* Actions of CreateStorageSystem */
export type CreateStorageSystemAction =
  | { type: 'wizard/setStepIdReached'; payload: number }
  | {
      type: 'wizard/setStorageClass';
      payload: WizardState['storageClass'];
    }
  | {
      type: 'wizard/setCreateStorageClass';
      payload: { field: ExternalStateKeys; value: ExternalStateValues };
    }
  | {
      type: 'wizard/setConnectionDetails';
      payload: { field: ExternalStateKeys; value: ExternalStateValues };
    }
  | {
      type: 'wizard/setCreateLocalVolumeSet';
      payload: { field: keyof LocalVolumeSet; value: LocalVolumeSet[keyof LocalVolumeSet] };
    }
  | {
      type: 'backingStorage/setDeployment';
      payload: WizardState['backingStorage']['deployment'];
    }
  | { type: 'backingStorage/setType'; payload: WizardState['backingStorage']['type'] }
  | {
      type: 'backingStorage/setExternalStorage';
      payload: WizardState['backingStorage']['externalStorage'];
    }
  | { type: 'wizard/setNodes'; payload: WizardState['nodes'] }
  | { type: 'capacityAndNodes/capacity'; payload: WizardState['capacityAndNodes']['capacity'] }
  | { type: 'capacityAndNodes/pvCount'; payload: WizardState['capacityAndNodes']['pvCount'] }
  | {
      type: 'capacityAndNodes/arbiterLocation';
      payload: WizardState['capacityAndNodes']['arbiterLocation'];
    }
  | {
      type: 'capacityAndNodes/enableArbiter';
      payload: WizardState['capacityAndNodes']['enableArbiter'];
    }
  | {
      type: 'capacityAndNodes/enableTaint';
      payload: WizardState['capacityAndNodes']['enableTaint'];
    }
  | {
      type: 'securityAndNetwork/setKms';
      payload: WizardState['securityAndNetwork']['kms'];
    }
  | {
      type: 'securityAndNetwork/setVault';
      payload: WizardState['securityAndNetwork']['kms']['vault'];
    }
  | {
      type: 'securityAndNetwork/setHpcs';
      payload: WizardState['securityAndNetwork']['kms']['hpcs'];
    }
  | {
      type: 'securityAndNetwork/setKmsProvider';
      payload: WizardState['securityAndNetwork']['kms']['kmsProvider'];
    }
  | {
      type: 'securityAndNetwork/setEncryption';
      payload: WizardState['securityAndNetwork']['encryption'];
    }
  | {
      type: 'securityAndNetwork/setPublicNetwork';
      payload: WizardState['securityAndNetwork']['publicNetwork'];
    }
  | {
      type: 'securityAndNetwork/setClusterNetwork';
      payload: WizardState['securityAndNetwork']['clusterNetwork'];
    }
  | {
      type: 'securityAndNetwork/setNetworkType';
      payload: WizardState['securityAndNetwork']['networkType'];
    };
