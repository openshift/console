import { deviceTypeDropdownItems } from '@console/local-storage-operator-plugin/src/constants';
import { StorageClassResourceKind, NodeKind } from '@console/internal/module/k8s';
import { diskModeDropdownItems, VaultEmptyState } from '../../../constants';
import { EncryptionType, VaultConfig, NetworkType } from '../../../types';

export const initialState: State = {
  // Step 1: Discover disks
  lvdIsSelectNodes: false,
  lvdAllNodes: [],
  lvdSelectNodes: [],
  lvdError: '',
  lvdInProgress: false,
  // Step 2: Create storage class
  lvsIsSelectNodes: false,
  lvsAllNodes: [],
  lvsSelectNodes: [],
  volumeSetName: '',
  storageClassName: '',
  isValidDiskSize: true,
  diskType: 'All',
  diskMode: diskModeDropdownItems.BLOCK,
  fsType: '',
  deviceType: [deviceTypeDropdownItems.DISK, deviceTypeDropdownItems.PART],
  maxDiskLimit: '',
  minDiskSize: '1',
  maxDiskSize: '',
  diskSizeUnit: 'Gi',
  isValidMaxSize: true,
  showConfirmModal: false,
  chartNodes: new Set(),
  // Steps 3-5:
  enableMinimal: false,
  enableFlexibleScaling: false,
  storageClass: { provisioner: '', reclaimPolicy: '' },
  nodes: [],
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
  availablePvsCount: 0,
  networkType: NetworkType.DEFAULT,
  clusterNetwork: '',
  publicNetwork: '',
  stretchClusterChecked: false,
  selectedArbiterZone: '',
};

export type State = {
  // Step 1: Discover disks
  lvdIsSelectNodes: boolean;
  lvdAllNodes: NodeKind[];
  lvdSelectNodes: NodeKind[];
  lvdInProgress: boolean;
  lvdError: string;
  // Step 2: Create storage class
  lvsIsSelectNodes: boolean;
  lvsAllNodes: NodeKind[];
  lvsSelectNodes: NodeKind[];
  volumeSetName: string;
  storageClassName: string;
  isValidDiskSize: boolean;
  diskType: string;
  diskMode: string;
  fsType: string;
  deviceType: string[];
  maxDiskLimit: string;
  minDiskSize: string;
  maxDiskSize: string;
  diskSizeUnit: string;
  isValidMaxSize: boolean;
  showConfirmModal: boolean;
  chartNodes: Set<string>;
  // Steps 3-5:
  enableMinimal: boolean;
  enableFlexibleScaling: boolean;
  storageClass: StorageClassResourceKind;
  nodes: NodeKind[];
  enableTaint: boolean;
  availablePvsCount: number;
  // Encryption state declare
  encryption: EncryptionType;
  kms: VaultConfig;
  networkType: NetworkType;
  clusterNetwork: string;
  publicNetwork: string;
  stretchClusterChecked: boolean;
  selectedArbiterZone: string;
};

export type Action =
  // Step 1: Discover disks
  | { type: 'setLvdIsSelectNodes'; value: boolean }
  | { type: 'setLvdAllNodes'; value: NodeKind[] }
  | { type: 'setLvdSelectNodes'; value: NodeKind[] }
  | { type: 'setLvdError'; value: string }
  | { type: 'setLvdInProgress'; value: boolean }
  // Step 2: Create storage class
  | { type: 'setLvsSelectNodes'; value: NodeKind[] }
  | { type: 'setLvsAllNodes'; value: NodeKind[] }
  | { type: 'setLvsIsSelectNodes'; value: boolean }
  | { type: 'setShowConfirmModal'; value: boolean }
  | { type: 'setVolumeSetName'; name: string }
  | { type: 'setStorageClassName'; name: string }
  | { type: 'setIsValidDiskSize'; value: boolean }
  | { type: 'setDiskType'; value: string }
  | { type: 'setDeviceType'; value: string[] }
  | { type: 'setDiskMode'; value: string }
  | { type: 'setFsType'; value: string }
  | { type: 'setMaxDiskLimit'; value: string }
  | { type: 'setNodeNames'; value: string[] }
  | { type: 'setMinDiskSize'; value: number | string }
  | { type: 'setMaxDiskSize'; value: number | string }
  | { type: 'setDiskSizeUnit'; value: string }
  | { type: 'setIsValidMaxSize'; value: boolean }
  | { type: 'setChartNodes'; value: Set<string> }
  // Steps 3-5:
  | { type: 'setEnableMinimal'; value: boolean }
  | { type: 'setEnableFlexibleScaling'; value: boolean }
  | { type: 'setStorageClass'; value: StorageClassResourceKind }
  | { type: 'setNodes'; value: NodeKind[] }
  | { type: 'setEnableTaint'; value: boolean }
  | { type: 'setAvailablePvsCount'; value: number }
  // Encryption state actions
  | { type: 'setEncryption'; value: EncryptionType }
  | { type: 'setKmsEncryption'; value: VaultConfig }
  | { type: 'clearKmsState' }
  | { type: 'setNetworkType'; value: NetworkType }
  | { type: 'setClusterNetwork'; value: string }
  | { type: 'setPublicNetwork'; value: string }
  | { type: 'setStretchClusterChecked'; value: boolean }
  | { type: 'setSelectedArbiterZone'; value: string };

export const reducer = (state: State, action: Action) => {
  switch (action.type) {
    // Step 1: Discover disks
    case 'setLvdIsSelectNodes':
      return Object.assign({}, state, { lvdIsSelectNodes: action.value });
    case 'setLvdAllNodes':
      return Object.assign({}, state, { lvdAllNodes: action.value });
    case 'setLvdSelectNodes':
      return Object.assign({}, state, { lvdSelectNodes: action.value });
    case 'setLvdError':
      return Object.assign({}, state, { lvdError: action.value });
    case 'setLvdInProgress':
      return Object.assign({}, state, { lvdInProgress: action.value });
    // Step 2: Create storage class
    case 'setLvsAllNodes':
      return Object.assign({}, state, { lvsAllNodes: action.value });
    case 'setLvsSelectNodes':
      return Object.assign({}, state, { lvsSelectNodes: action.value });
    case 'setLvsIsSelectNodes':
      return Object.assign({}, state, { lvsIsSelectNodes: action.value });
    case 'setShowConfirmModal':
      return Object.assign({}, state, { showConfirmModal: action.value });
    case 'setVolumeSetName':
      return Object.assign({}, state, { volumeSetName: action.name });
    case 'setStorageClassName':
      return Object.assign({}, state, { storageClassName: action.name });
    case 'setIsValidDiskSize':
      return Object.assign({}, state, { isValidDiskSize: action.value });
    case 'setDiskType':
      return Object.assign({}, state, { diskType: action.value });
    case 'setDiskMode':
      return Object.assign({}, state, { diskMode: action.value });
    case 'setFsType':
      return Object.assign({}, state, { fsType: action.value });
    case 'setDeviceType':
      return Object.assign({}, state, { deviceType: action.value });
    case 'setMaxDiskLimit':
      return Object.assign({}, state, { maxDiskLimit: action.value });
    case 'setMinDiskSize':
      return Object.assign({}, state, { minDiskSize: action.value });
    case 'setMaxDiskSize':
      return Object.assign({}, state, { maxDiskSize: action.value });
    case 'setDiskSizeUnit':
      return Object.assign({}, state, { diskSizeUnit: action.value });
    case 'setIsValidMaxSize':
      return Object.assign({}, state, { isValidMaxSize: action.value });
    case 'setChartNodes':
      return Object.assign({}, state, { chartNodes: action.value });
    // Steps 3-5:
    case 'setEnableMinimal':
      return Object.assign({}, state, { enableMinimal: action.value });
    case 'setEnableFlexibleScaling':
      return Object.assign({}, state, { enableFlexibleScaling: action.value });
    case 'setStorageClass':
      return Object.assign({}, state, { storageClass: action.value });
    case 'setNodes':
      return Object.assign({}, state, { nodes: action.value });
    case 'setEnableTaint':
      return Object.assign({}, state, { enableTaint: action.value });
    case 'setAvailablePvsCount':
      return Object.assign({}, state, { availablePvsCount: action.value });
    // Encryption state reducer
    case 'setEncryption':
      return Object.assign({}, state, { encryption: action.value });
    // KMS state reducer
    case 'setKmsEncryption':
      return Object.assign({}, state, { kms: action.value });
    case 'clearKmsState':
      return Object.assign({}, state, { kms: { ...VaultEmptyState } });
    case 'setNetworkType':
      return Object.assign({}, state, { networkType: action.value });
    case 'setClusterNetwork':
      return Object.assign({}, state, { clusterNetwork: action.value });
    case 'setPublicNetwork':
      return Object.assign({}, state, { publicNetwork: action.value });
    // Arbiter state reducer
    case 'setStretchClusterChecked':
      return Object.assign({}, state, { stretchClusterChecked: action.value });
    case 'setSelectedArbiterZone':
      return Object.assign({}, state, { selectedArbiterZone: action.value });

    default:
      return initialState;
  }
};
