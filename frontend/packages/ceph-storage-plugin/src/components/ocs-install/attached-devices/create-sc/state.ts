import { HostNamesMap } from '@console/local-storage-operator-plugin/src/components/auto-detect-volume/types';
import { diskModeDropdownItems, KMSEmptyState } from '../../../../constants';
import { StorageClassResourceKind, NodeKind } from '@console/internal/module/k8s';
import { EncryptionType, KMSConfig, NetworkType } from '../../types';

export const initialState: State = {
  // states for step 1
  showNodesListOnADV: false,
  nodeNamesForLVS: [], // nodes selected on discovery step, used in LVS step
  allNodeNamesOnADV: [], // all nodes present in the env
  hostNamesMapForADV: {},

  // states for step 2
  volumeSetName: '',
  storageClassName: '',
  showNodesListOnLVS: false,
  diskType: 'All',
  diskMode: diskModeDropdownItems.BLOCK,
  deviceType: [],
  maxDiskLimit: '',
  nodeNames: [], // nodes selected on the LVS step
  minDiskSize: '1',
  maxDiskSize: '',
  diskSizeUnit: 'Gi',
  isValidMaxSize: true,
  hostNamesMapForLVS: {},
  // states for chart
  nodesDiscoveries: [],
  filteredDiscoveries: [],
  filteredNodes: [],
  chartSelectedData: 0,
  chartTotalData: 0,
  showConfirmModal: false,
  finalStep: false,
  showDiskList: false,
  showNodeList: false,

  // common states
  isLoading: false,
  error: '',
  onNextClick: null,

  // states for step 3-5
  enableMinimal: false,
  enableFlexibleScaling: false,
  storageClass: { provisioner: '', reclaimPolicy: '' },
  nodes: [],
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
  networkType: NetworkType.DEFAULT,
  clusterNetwork: '',
  publicNetwork: '',
  stretchClusterChecked: false,
  selectedArbiterZone: '',
};

export type Discoveries = {
  size: number;
  path: string;
  fstype: string;
  vendor: string;
  model: string;
  status: {
    state: string;
  };
  deviceID: string;
  type: string;
  property: string;
  node: string;
};

export type OnNextClick = () => void;

export type State = {
  volumeSetName: string;
  storageClassName: string;
  showNodesListOnLVS: boolean;
  diskType: string;
  diskMode: string;
  deviceType: string[];
  maxDiskLimit: string;
  nodeNames: string[];
  minDiskSize: string;
  maxDiskSize: string;
  diskSizeUnit: string;
  isValidMaxSize: boolean;
  chartSelectedData: number;
  chartTotalData: number;
  showNodesListOnADV: boolean;
  nodeNamesForLVS: string[];
  isLoading: boolean;
  error: string;
  allNodeNamesOnADV: string[];
  nodesDiscoveries: Discoveries[];
  showConfirmModal: boolean;
  onNextClick: () => void;
  filteredDiscoveries: Discoveries[];
  filteredNodes: string[];
  finalStep: boolean;
  showDiskList: boolean;
  hostNamesMapForADV: HostNamesMap;
  hostNamesMapForLVS: HostNamesMap;
  showNodeList: boolean;
  enableMinimal: boolean;
  enableFlexibleScaling: boolean;
  storageClass: StorageClassResourceKind;
  nodes: NodeKind[];
  // Encryption state declare
  encryption: EncryptionType;
  kms: KMSConfig;
  networkType: NetworkType;
  clusterNetwork: string;
  publicNetwork: string;
  stretchClusterChecked: boolean;
  selectedArbiterZone: string;
};

export type Action =
  | { type: 'setVolumeSetName'; name: string }
  | { type: 'setStorageClassName'; name: string }
  | { type: 'setShowNodesListOnLVS'; value: boolean }
  | { type: 'setDiskType'; value: string }
  | { type: 'setDeviceType'; value: string[] }
  | { type: 'setDiskMode'; value: string }
  | { type: 'setMaxDiskLimit'; value: string }
  | { type: 'setNodeNames'; value: string[] }
  | { type: 'setMinDiskSize'; value: number | string }
  | { type: 'setMaxDiskSize'; value: number | string }
  | { type: 'setDiskSizeUnit'; value: string }
  | { type: 'setIsValidMaxSize'; value: boolean }
  | { type: 'setAllNodeNames'; value: string[] }
  | { type: 'setShowNodesListOnADV'; value: boolean }
  | { type: 'setNodeNamesForLVS'; value: string[] }
  | { type: 'setIsLoading'; value: boolean }
  | { type: 'setError'; value: string }
  | { type: 'setAllNodeNamesOnADV'; value: string[] }
  | { type: 'setNodesDiscoveries'; value: Discoveries[] }
  | { type: 'setChartSelectedData'; value: number }
  | { type: 'setChartTotalData'; value: number }
  | { type: 'setShowConfirmModal'; value: boolean }
  | { type: 'setOnNextClick'; value: OnNextClick }
  | { type: 'setFilteredDiscoveries'; value: Discoveries[] }
  | { type: 'setFinalStep'; value: boolean }
  | { type: 'setShowDiskList'; value: boolean }
  | { type: 'setHostNamesMapForADV'; value: HostNamesMap }
  | { type: 'setHostNamesMapForLVS'; value: HostNamesMap }
  | { type: 'setShowNodeList'; value: boolean }
  | { type: 'setFilteredNodes'; value: string[] }
  | { type: 'setEnableMinimal'; value: boolean }
  | { type: 'setEnableFlexibleScaling'; value: boolean }
  | { type: 'setStorageClass'; value: StorageClassResourceKind }
  | { type: 'setNodes'; value: NodeKind[] }
  // Encryption state actions
  | { type: 'setEncryption'; value: EncryptionType }
  | { type: 'setKmsEncryption'; value: KMSConfig }
  | { type: 'clearKmsState' }
  | { type: 'setNetworkType'; value: NetworkType }
  | { type: 'setClusterNetwork'; value: string }
  | { type: 'setPublicNetwork'; value: string }
  | { type: 'setStretchClusterChecked'; value: boolean }
  | { type: 'setSelectedArbiterZone'; value: string };

export const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'setVolumeSetName':
      return Object.assign({}, state, { volumeSetName: action.name });
    case 'setStorageClassName':
      return Object.assign({}, state, { storageClassName: action.name });
    case 'setShowNodesListOnLVS':
      return Object.assign({}, state, { showNodesListOnLVS: action.value });
    case 'setDiskType':
      return Object.assign({}, state, { diskType: action.value });
    case 'setDiskMode':
      return Object.assign({}, state, { diskMode: action.value });
    case 'setDeviceType':
      return Object.assign({}, state, { deviceType: action.value });
    case 'setMaxDiskLimit':
      return Object.assign({}, state, { maxDiskLimit: action.value });
    case 'setNodeNames':
      return Object.assign({}, state, { nodeNames: action.value });
    case 'setMinDiskSize':
      return Object.assign({}, state, { minDiskSize: action.value });
    case 'setMaxDiskSize':
      return Object.assign({}, state, { maxDiskSize: action.value });
    case 'setDiskSizeUnit':
      return Object.assign({}, state, { diskSizeUnit: action.value });
    case 'setIsValidMaxSize':
      return Object.assign({}, state, { isValidMaxSize: action.value });
    case 'setShowNodesListOnADV':
      return Object.assign({}, state, { showNodesListOnADV: action.value });
    case 'setNodeNamesForLVS':
      return Object.assign({}, state, { nodeNamesForLVS: action.value });
    case 'setIsLoading':
      return Object.assign({}, state, { isLoading: action.value });
    case 'setError':
      return Object.assign({}, state, { error: action.value });
    case 'setAllNodeNamesOnADV':
      return Object.assign({}, state, { allNodeNamesOnADV: action.value });
    case 'setNodesDiscoveries':
      return Object.assign({}, state, { nodesDiscoveries: action.value });
    case 'setChartSelectedData':
      return Object.assign({}, state, { chartSelectedData: action.value });
    case 'setChartTotalData':
      return Object.assign({}, state, { chartTotalData: action.value });
    case 'setShowConfirmModal':
      return Object.assign({}, state, { showConfirmModal: action.value });
    case 'setOnNextClick':
      return Object.assign({}, state, { onNextClick: action.value });
    case 'setFilteredDiscoveries':
      return Object.assign({}, state, { filteredDiscoveries: action.value });
    case 'setFinalStep':
      return Object.assign({}, state, { finalStep: action.value });
    case 'setShowDiskList':
      return Object.assign({}, state, { showDiskList: action.value });
    case 'setHostNamesMapForADV':
      return Object.assign({}, state, { hostNamesMapForADV: action.value });
    case 'setHostNamesMapForLVS':
      return Object.assign({}, state, { hostNamesMapForLVS: action.value });
    case 'setShowNodeList':
      return Object.assign({}, state, { showNodeList: action.value });
    case 'setFilteredNodes':
      return Object.assign({}, state, { filteredNodes: action.value });
    case 'setEnableMinimal':
      return Object.assign({}, state, { enableMinimal: action.value });
    case 'setEnableFlexibleScaling':
      return Object.assign({}, state, { enableFlexibleScaling: action.value });
    case 'setStorageClass':
      return Object.assign({}, state, { storageClass: action.value });
    case 'setNodes':
      return Object.assign({}, state, { nodes: action.value });
    // Encryption state reducer
    case 'setEncryption':
      return Object.assign({}, state, { encryption: action.value });
    // KMS state reducer
    case 'setKmsEncryption':
      return Object.assign({}, state, { kms: action.value });
    case 'clearKmsState':
      return Object.assign({}, state, { kms: { ...KMSEmptyState } });
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
