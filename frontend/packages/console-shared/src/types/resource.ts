import { K8sResourceKind, PodKind, RouteKind } from '@console/internal/module/k8s';
import { DEPLOYMENT_STRATEGY } from '../constants';

export type OverviewItemAlerts = {
  [key: string]: {
    message: string;
    severity: string;
  };
};

export type PodControllerOverviewItem = {
  alerts: OverviewItemAlerts;
  revision: number;
  obj: K8sResourceKind;
  phase?: string;
  pods: PodKind[];
};

export type BuildConfigOverviewItem = K8sResourceKind & {
  builds: K8sResourceKind[];
};

export type OverviewItem = {
  alerts?: OverviewItemAlerts;
  buildConfigs: BuildConfigOverviewItem[];
  current?: PodControllerOverviewItem;
  isRollingOut?: boolean;
  obj: K8sResourceKind;
  pods?: PodKind[];
  previous?: PodControllerOverviewItem;
  routes: RouteKind[];
  services: K8sResourceKind[];
  status?: React.ReactNode;
  ksroutes?: K8sResourceKind[];
  configurations?: K8sResourceKind[];
  ksservices?: K8sResourceKind[];
  revisions?: K8sResourceKind[];
};

export type DeploymentStrategy = DEPLOYMENT_STRATEGY.recreate | DEPLOYMENT_STRATEGY.rolling;
