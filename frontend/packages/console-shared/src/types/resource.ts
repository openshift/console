import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';

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
  routes: K8sResourceKind[];
  services: K8sResourceKind[];
  status?: React.ReactNode;
  ksroutes?: K8sResourceKind[];
  configurations?: K8sResourceKind[];
  ksservices?: K8sResourceKind[];
  revisions?: K8sResourceKind[];
};
