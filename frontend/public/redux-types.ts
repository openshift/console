import { Map as ImmutableMap } from 'immutable';
import { Alert } from '@console/shared/src/types/monitoring';

export type NotificationAlerts = {
  data: Alert[];
  loaded: boolean;
  loadError?: {
    message?: string;
  };
};

export enum MonitoringRoutes {
  Kibana = 'kibana',
}

export enum RESULTS_TYPE {
  PROMETHEUS = 'PROMETHEUS',
  URL = 'URL',
  ALERTS = 'ALERTS',
}

export type FeatureState = ImmutableMap<string, boolean>;

type Request<R> = {
  active: boolean;
  timeout: NodeJS.Timer;
  inFlight: boolean;
  data: R;
  error: any;
};

export type RequestMap<R> = ImmutableMap<string, Request<R>>;

export type DashboardsState = ImmutableMap<string, RequestMap<any>>;

export type K8sState = ImmutableMap<string, any>;

export type UIState = ImmutableMap<string, any>;

export type MonitoringState = ImmutableMap<string, any>;

export type RootState = {
  k8s: K8sState;
  UI: UIState;
  FLAGS: FeatureState;
  monitoringURLs: MonitoringState;
  dashboards: DashboardsState;
  plugins?: {
    [namespace: string]: any;
  };
};
