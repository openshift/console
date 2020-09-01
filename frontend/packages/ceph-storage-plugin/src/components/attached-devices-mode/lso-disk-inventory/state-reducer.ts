export enum ActionType {
  SET_ALERTS_MAP = 'SET_ALERTS_MAP',
  SET_TEMPLATES_MAP = 'SET_TEMPLATES_MAP',
  SET_METRICS_MAP = 'SET_METRICS_MAP',
  SET_IS_REBALANCING = 'SET_IS_REBALANCING',
  SET_REPLACEMENT_MAP = 'SET_REPLACEMENT_MAP',
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

export const initialState: OCSColumnState = {
  metricsMap: {},
  alertsMap: {},
  isRebalancing: false,
  replacementMap: {},
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
    case ActionType.SET_REPLACEMENT_MAP: {
      return {
        ...state,
        replacementMap: action.payload,
      };
    }
    case ActionType.SET_IS_REBALANCING: {
      return {
        ...state,
        isRebalancing: action.payload,
      };
    }
    default:
      return state;
  }
};

export type OCSColumnStateAction =
  | { type: ActionType.SET_ALERTS_MAP; payload: OCSDiskList }
  | { type: ActionType.SET_METRICS_MAP; payload: OCSDiskList }
  | { type: ActionType.SET_REPLACEMENT_MAP; payload: OCSDiskList }
  | { type: ActionType.SET_IS_REBALANCING; payload: boolean };

export type OCSColumnState = {
  metricsMap: OCSDiskList;
  alertsMap: OCSDiskList;
  replacementMap: OCSDiskList;
  isRebalancing: boolean;
};

export type OCSDiskList = {
  [diskName: string]: OCSDiskMetadata;
};

export type OCSDiskStatus = keyof typeof Status;

export type OCSDiskMetadata = { osd: string; status: OCSDiskStatus };

export type AlertsDiskMap = {
  [disk: string]: string;
};
