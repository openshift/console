import type { DashboardsState } from './dashboards';

export enum RESULTS_TYPE {
  PROMETHEUS = 'PROMETHEUS',
  URL = 'URL',
  ALERTS = 'ALERTS',
}

export const isWatchActive = (state: DashboardsState, type: string, key: string): boolean =>
  state[type]?.[key]?.active > 0 || state[type]?.[key]?.inFlight;
