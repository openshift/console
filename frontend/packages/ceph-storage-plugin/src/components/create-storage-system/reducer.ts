import * as _ from 'lodash';
import {
  deviceTypeDropdownItems,
  diskModeDropdownItems,
} from '@console/local-storage-operator-plugin/src/constants';
import { NodeKind } from '@console/internal/module/k8s';
import { ExternalState, ExternalStateKeys, ExternalStateValues } from './external-storage/types';
import { BackingStorageType, DeploymentType } from '../../constants/create-storage-system';
import { EncryptionType, KMSConfig, NetworkType } from '../../types';

export type WizardState = CreateStorageSystemState;
export type WizardDispatch = React.Dispatch<CreateStorageSystemAction>;

export type WizardCommonProps = {
  state: WizardState;
  dispatch: WizardDispatch;
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
};

/* State of CreateStorageSystem */
export const initialState: CreateStorageSystemState = {
  stepIdReached: 1,
  storageClass: { name: '', provisioner: '' },
  backingStorage: {
    type: BackingStorageType.EXISTING,
    externalStorage: '',
    deployment: DeploymentType.ALL,
    isAdvancedOpen: false,
  },
  capacityAndNodes: {
    nodes: [],
    capacity: '2Ti',
    enableArbiter: false,
    pvCount: 0,
  },
  createStorageClass: {},
  connectionDetails: {},
  createLocalVolumeSet: {
    lvsIsSelectNodes: false,
    lvsAllNodes: [],
    lvsSelectNodes: [],
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
  },
};

type CreateStorageSystemState = {
  stepIdReached: number;
  storageClass: { name: string; provisioner?: string };
  backingStorage: {
    type: BackingStorageType;
    externalStorage: string;
    deployment: DeploymentType;
    isAdvancedOpen: boolean;
  };
  createStorageClass: ExternalState;
  connectionDetails: ExternalState;
  capacityAndNodes: {
    nodes: WizardNodeState[];
    capacity: string;
    enableArbiter: boolean;
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

export type LocalVolumeSet = {
  lvsIsSelectNodes: boolean;
  lvsAllNodes: NodeKind[];
  lvsSelectNodes: NodeKind[];
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

/* Reducer of CreateStorageSystem */
export const reducer: WizardReducer = (prevState, action) => {
  const newState = _.cloneDeep(prevState);
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
      newState.backingStorage.type = action.payload;
      break;
    case 'backingStorage/setDeployment':
      newState.backingStorage.deployment = action.payload;
      break;
    case 'backingStorage/setExternalStorage':
      newState.backingStorage.externalStorage = action.payload;
      break;
    case 'backingStorage/setIsAdvancedOpen':
      newState.backingStorage.isAdvancedOpen = action.payload;
      break;
    case 'capacityAndNodes/nodes':
      newState.capacityAndNodes.nodes = action.payload;
      break;
    case 'capacityAndNodes/capacity':
      newState.capacityAndNodes.capacity = action.payload;
      break;
    case 'capacityAndNodes/pvCount':
      newState.capacityAndNodes.pvCount = action.payload;
      break;
    case 'securityAndNetwork/setKms':
      newState.securityAndNetwork.kms = action.payload;
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
  | {
      type: 'backingStorage/setIsAdvancedOpen';
      payload: WizardState['backingStorage']['isAdvancedOpen'];
    }
  | { type: 'backingStorage/setType'; payload: WizardState['backingStorage']['type'] }
  | {
      type: 'backingStorage/setExternalStorage';
      payload: WizardState['backingStorage']['externalStorage'];
    }
  | { type: 'capacityAndNodes/nodes'; payload: WizardState['capacityAndNodes']['nodes'] }
  | { type: 'capacityAndNodes/capacity'; payload: WizardState['capacityAndNodes']['capacity'] }
  | { type: 'capacityAndNodes/pvCount'; payload: WizardState['capacityAndNodes']['pvCount'] }
  | {
      type: 'securityAndNetwork/setKms';
      payload: WizardState['securityAndNetwork']['kms'];
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
