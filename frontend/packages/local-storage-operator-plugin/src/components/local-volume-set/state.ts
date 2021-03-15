import { NodeKind } from 'public/module/k8s';
import { diskModeDropdownItems } from '../../constants';

export const initialState = {
  volumeSetName: '',
  storageClassName: '',
  isValidDiskSize: true,
  diskType: 'All',
  diskMode: diskModeDropdownItems.BLOCK,
  deviceType: [],
  maxDiskLimit: '',
  minDiskSize: '1',
  maxDiskSize: '',
  diskSizeUnit: 'Gi',
  lvsSelectNodes: [],
  lvsAllNodes: [],
  lvsIsSelectNodes: false,
};

export type State = {
  volumeSetName: string;
  storageClassName: string;
  isValidDiskSize: boolean;
  diskType: string;
  diskMode: string;
  deviceType: string[];
  maxDiskLimit: string;
  minDiskSize: string;
  maxDiskSize: string;
  diskSizeUnit: string;
  lvsSelectNodes: NodeKind[];
  lvsAllNodes: NodeKind[];
  lvsIsSelectNodes: boolean;
};

export type Action =
  | { type: 'setVolumeSetName'; name: string }
  | { type: 'setStorageClassName'; name: string }
  | { type: 'setIsValidDiskSize'; value: boolean }
  | { type: 'setDiskType'; value: string }
  | { type: 'setDiskMode'; value: string }
  | { type: 'setMaxDiskLimit'; value: string }
  | { type: 'setMinDiskSize'; value: string }
  | { type: 'setMaxDiskSize'; value: string }
  | { type: 'setDiskSizeUnit'; value: string }
  | { type: 'setDeviceType'; value: string[] }
  | { type: 'setLvsSelectNodes'; value: NodeKind[] }
  | { type: 'setLvsAllNodes'; value: NodeKind[] }
  | { type: 'setLvsIsSelectNodes'; value: boolean };

export const reducer = (state: State, action: Action) => {
  switch (action.type) {
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
    case 'setLvsAllNodes':
      return Object.assign({}, state, { lvsAllNodes: action.value });
    case 'setLvsSelectNodes':
      return Object.assign({}, state, { lvsSelectNodes: action.value });
    case 'setLvsIsSelectNodes':
      return Object.assign({}, state, { lvsIsSelectNodes: action.value });
    default:
      return initialState;
  }
};
