import {
  HorizontalPodAutoscalerKind,
  JobKind,
  K8sResourceKind,
  PodKind,
  RouteKind,
} from '@console/internal/module/k8s';
import { DEPLOYMENT_STRATEGY } from '../constants';
import { OverviewItemAlerts, PodControllerOverviewItem } from './pod';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import { Alert } from '@console/internal/components/monitoring/types';

export type APIError = {
  status?: string;
  message?: string;
  reason?: string;
  details?: {
    name?: string;
    kind?: string;
  };
  code?: number;
};

export type BuildConfigOverviewItem = K8sResourceKind & {
  builds: K8sResourceKind[];
};

export type OverviewItem<T = K8sResourceKind> = {
  alerts?: OverviewItemAlerts;
  buildConfigs: BuildConfigOverviewItem[];
  current?: PodControllerOverviewItem;
  isRollingOut?: boolean;
  obj: T;
  hpas?: HorizontalPodAutoscalerKind[];
  pods?: PodKind[];
  previous?: PodControllerOverviewItem;
  routes: RouteKind[];
  services: K8sResourceKind[];
  jobs?: JobKind[];
  status?: React.ReactNode;
  ksroutes?: K8sResourceKind[];
  configurations?: K8sResourceKind[];
  ksservices?: K8sResourceKind[];
  eventSources?: K8sResourceKind[];
  revisions?: K8sResourceKind[];
  isOperatorBackedService?: boolean;
  isMonitorable?: boolean;
  monitoringAlerts?: Alert[];
};

export type OperatorBackedServiceKindMap = {
  [name: string]: ClusterServiceVersionKind;
};

export type DeploymentStrategy = DEPLOYMENT_STRATEGY.recreate | DEPLOYMENT_STRATEGY.rolling;
