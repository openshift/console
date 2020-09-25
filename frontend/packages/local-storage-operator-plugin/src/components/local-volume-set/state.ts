import { diskTypeDropdownItems, diskModeDropdownItems } from '../../constants';
import { HostNamesMap } from '../auto-detect-volume/types';

export const initialState = {
  volumeSetName: '',
  storageClassName: '',
  showNodesListOnLVS: false,
  diskType: diskTypeDropdownItems.SSD,
  diskMode: diskModeDropdownItems.BLOCK,
  maxDiskLimit: '',
  nodeNames: [],
  minDiskSize: '0',
  maxDiskSize: '',
  diskSizeUnit: 'Ti',
  isValidMaxSize: true,
  nodeNamesForLVS: [],
  hostNamesMapForLVS: {},
};

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
  nodeNamesForLVS: string[];
  hostNamesMapForLVS: HostNamesMap;
};

export type Action =
  | { type: 'setVolumeSetName'; name: string }
  | { type: 'setStorageClassName'; name: string }
  | { type: 'setShowNodesListOnLVS'; value: boolean }
  | { type: 'setDiskType'; value: string }
  | { type: 'setDiskMode'; value: string }
  | { type: 'setMaxDiskLimit'; value: string }
  | { type: 'setNodeNames'; value: string[] }
  | { type: 'setMinDiskSize'; value: string }
  | { type: 'setMaxDiskSize'; value: string }
  | { type: 'setDiskSizeUnit'; value: string }
  | { type: 'setIsValidMaxSize'; value: boolean }
  | { type: 'setNodeNamesForLVS'; value: string[] }
  | { type: 'setHostNamesMapForLVS'; value: HostNamesMap };

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
    case 'setNodeNamesForLVS':
      return Object.assign({}, state, { nodeNamesForLVS: action.value });
    case 'setHostNamesMapForLVS':
      return Object.assign({}, state, { hostNamesMapForLVS: action.value });
    default:
      return initialState;
  }
};
