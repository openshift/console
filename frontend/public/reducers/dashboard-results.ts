import type { DashboardsState } from './dashboards';

export enum RESULTS_TYPE {
  PROMETHEUS = 'PROMETHEUS',
  URL = 'URL',
  ALERTS = 'ALERTS',
}

export const isWatchActive = (state: DashboardsState, type: string, key: string): boolean =>
  state.getIn([type, key, 'active']) > 0 || state.getIn([type, key, 'inFlight']);
