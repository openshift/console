import { HostNamesMap } from '@console/local-storage-operator-plugin/src/components/auto-detect-volume/types';
import { diskTypeDropdownItems, diskModeDropdownItems } from '../../../../constants';

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
  diskType: diskTypeDropdownItems.SSD,
  diskMode: diskModeDropdownItems.BLOCK,
  maxDiskLimit: '',
  nodeNames: [], // nodes selected on the LVS step
  minDiskSize: '0',
  maxDiskSize: '',
  diskSizeUnit: 'TiB',
  isValidMaxSize: true,
  hostNamesMapForLVS: {},
  // states for chart
  nodesDiscoveries: [],
  filteredDiscoveries: [],
  filteredNodes: [],
  chartSelectedData: '',
  chartTotalData: '',
  chartDataUnit: '',
  showConfirmModal: false,
  finalStep: false,
  showDiskList: false,
  showNodeList: false,

  // common states
  isLoading: false,
  error: '',
  onNextClick: null,
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
  maxDiskLimit: string;
  nodeNames: string[];
  minDiskSize: string;
  maxDiskSize: string;
  diskSizeUnit: string;
  isValidMaxSize: boolean;
  chartSelectedData: string;
  chartTotalData: string;
  chartDataUnit: string;
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
};

export type Action =
  | { type: 'setVolumeSetName'; name: string }
  | { type: 'setStorageClassName'; name: string }
  | { type: 'setShowNodesListOnLVS'; value: boolean }
  | { type: 'setDiskType'; value: string }
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
  | { type: 'setChartSelectedData'; value: string }
  | { type: 'setChartTotalData'; value: string }
  | { type: 'setChartDataUnit'; unit: string }
  | { type: 'setShowConfirmModal'; value: boolean }
  | { type: 'setOnNextClick'; value: OnNextClick }
  | { type: 'setFilteredDiscoveries'; value: Discoveries[] }
  | { type: 'setFinalStep'; value: boolean }
  | { type: 'setShowDiskList'; value: boolean }
  | { type: 'setHostNamesMapForADV'; value: HostNamesMap }
  | { type: 'setHostNamesMapForLVS'; value: HostNamesMap }
  | { type: 'setShowNodeList'; value: boolean }
  | { type: 'setFilteredNodes'; value: string[] };

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
    case 'setChartDataUnit':
      return Object.assign({}, state, { chartDataUnit: action.unit });
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
    default:
      return initialState;
  }
};
