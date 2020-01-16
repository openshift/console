import { K8sResourceKind, PodKind, RouteKind, EventKind } from '@console/internal/module/k8s';
import { DEPLOYMENT_STRATEGY } from '../constants';
import { OverviewItemAlerts, PodControllerOverviewItem } from './pod';

export type BuildConfigOverviewItem = K8sResourceKind & {
  builds: K8sResourceKind[];
};

export type OverviewItem<T = K8sResourceKind> = {
  alerts?: OverviewItemAlerts;
  buildConfigs: BuildConfigOverviewItem[];
  current?: PodControllerOverviewItem;
  isRollingOut?: boolean;
  obj: T;
  pods?: PodKind[];
  previous?: PodControllerOverviewItem;
  routes: RouteKind[];
  services: K8sResourceKind[];
  status?: React.ReactNode;
  ksroutes?: K8sResourceKind[];
  configurations?: K8sResourceKind[];
  ksservices?: K8sResourceKind[];
  revisions?: K8sResourceKind[];
  events?: EventKind[];
};

export type DeploymentStrategy = DEPLOYMENT_STRATEGY.recreate | DEPLOYMENT_STRATEGY.rolling;
