import { TFunction } from 'i18next';

export enum ActionType {
  SET_ALERTS_MAP = 'SET_ALERTS_MAP',
  SET_TEMPLATES_MAP = 'SET_TEMPLATES_MAP',
  SET_METRICS_MAP = 'SET_METRICS_MAP',
  SET_IS_REBALANCING = 'SET_IS_REBALANCING',
  SET_REPLACED_DISK_LIST = 'SET_REPLACED_DISK_LIST',
  SET_REPLACING_DISK_LIST = 'SET_REPLACING_DISK_LIST',
}

export enum Status {
  Online = 'Online',
  Offline = 'Offline',
  NotResponding = 'NotResponding',
  PreparingToReplace = 'PreparingToReplace',
  ReplacementReady = 'ReplacementReady',
  ReplacementFailed = 'ReplacementFailed',
  Unknown = 'Unknown',
}

export const getOCSColumnStatus = (status: keyof typeof Status, t: TFunction) => {
  switch (status) {
    case Status.Online:
      return t('ceph-storage-plugin~Online');
    case Status.Offline:
      return t('ceph-storage-plugin~Offline');
    case Status.NotResponding:
      return t('ceph-storage-plugin~NotResponding');
    case Status.PreparingToReplace:
      return t('ceph-storage-plugin~PreparingToReplace');
    case Status.ReplacementFailed:
      return t('ceph-storage-plugin~ReplacementFailed');
    case Status.ReplacementReady:
      return t('ceph-storage-plugin~ReplacementReady');
    case Status.Unknown:
      return t('ceph-storage-plugin~Unknown');
    default:
      return '';
  }
};

export const initialState: OCSColumnState = {
  metricsMap: {},
  alertsMap: {},
  isRebalancing: false,
  replacedDiskList: [],
  replacingDiskList: [],
};

export const reducer = (state: OCSColumnState, action: OCSColumnStateAction) => {
  switch (action.type) {
    case ActionType.SET_ALERTS_MAP: {
      return {
        ...state,
        alertsMap: action.payload,
      };
    }
    case ActionType.SET_METRICS_MAP: {
      return {
        ...state,
        metricsMap: action.payload,
      };
    }
    case ActionType.SET_REPLACED_DISK_LIST: {
      return {
        ...state,
        replacedDiskList: action.payload,
      };
    }
    case ActionType.SET_IS_REBALANCING: {
      return {
        ...state,
        isRebalancing: action.payload,
      };
    }
    case ActionType.SET_REPLACING_DISK_LIST: {
      return {
        ...state,
        replacingDiskList: action.payload,
      };
    }
    default:
      return state;
  }
};

export type OCSColumnStateAction =
  | { type: ActionType.SET_ALERTS_MAP; payload: OCSDiskList }
  | { type: ActionType.SET_METRICS_MAP; payload: OCSDiskList }
  | { type: ActionType.SET_REPLACED_DISK_LIST; payload: ReplacedDisk[] }
  | { type: ActionType.SET_IS_REBALANCING; payload: boolean }
  | {
      type: ActionType.SET_REPLACING_DISK_LIST;
      payload: {
        id: string;
        path: string;
        serial: string;
      }[];
    };

export type OCSColumnState = {
  metricsMap: OCSDiskList;
  alertsMap: OCSDiskList;
  isRebalancing: boolean;
  replacedDiskList: ReplacedDisk[];
  replacingDiskList: {
    id: string;
    path: string;
    serial: string;
  }[];
};

export type ReplacedDisk = OCSDiskMetadata & {
  disk: {
    id: string;
    path: string;
    serial: string;
  };
};

export type OCSDiskList = {
  [diskName: string]: OCSDiskMetadata;
};

export type OCSDiskStatus = keyof typeof Status;

export type OCSDiskMetadata = { osd: string; status: OCSDiskStatus; node: string };

export type AlertsDiskMap = {
  [disk: string]: string;
};
