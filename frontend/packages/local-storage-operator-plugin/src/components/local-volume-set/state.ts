import { MAX_DISK_SIZE, diskTypeDropdownItems, diskModeDropdownItems } from '../../constants';

export const initialState = {
  volumeSetName: '',
  storageClassName: '',
  showNodesList: false,
  diskType: diskTypeDropdownItems.SSD,
  diskMode: diskModeDropdownItems.BLOCK,
  maxDiskLimit: '',
  nodeNames: [],
  minDiskSize: 0,
  maxDiskSize: MAX_DISK_SIZE,
  diskSizeUnit: 'TiB',
  isValidMaxSize: true,
  allNodeNames: [],
};

export type State = {
  volumeSetName: string;
  storageClassName: string;
  showNodesList: boolean;
  diskType: string;
  diskMode: string;
  maxDiskLimit: string;
  nodeNames: string[];
  minDiskSize: number | string;
  maxDiskSize: number | string;
  diskSizeUnit: string;
  isValidMaxSize: boolean;
  allNodeNames: string[];
};

export type Action =
  | { type: 'setVolumeSetName'; name: string }
  | { type: 'setStorageClassName'; name: string }
  | { type: 'setShowNodesList'; value: boolean }
  | { type: 'setDiskType'; value: string }
  | { type: 'setDiskMode'; value: string }
  | { type: 'setMaxDiskLimit'; value: string }
  | { type: 'setNodeNames'; value: string[] }
  | { type: 'setMinDiskSize'; value: number | string }
  | { type: 'setMaxDiskSize'; value: number | string }
  | { type: 'setDiskSizeUnit'; value: string }
  | { type: 'setIsValidMaxSize'; value: boolean }
  | { type: 'setAllNodeNames'; value: string[] };

export const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'setVolumeSetName':
      return Object.assign({}, state, { volumeSetName: action.name });
    case 'setStorageClassName':
      return Object.assign({}, state, { storageClassName: action.name });
    case 'setShowNodesList':
      return Object.assign({}, state, { showNodesList: action.value });
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
    case 'setAllNodeNames':
      return Object.assign({}, state, { allNodeNames: action.value });
    default:
      return initialState;
  }
};
