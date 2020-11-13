import {
  HorizontalPodAutoscalerKind,
  K8sResourceKind,
  PodKind,
} from '@console/internal/module/k8s';
import { DEPLOYMENT_STRATEGY } from '../constants';
import { PodControllerOverviewItem } from './pod';
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
  current?: PodControllerOverviewItem;
  isRollingOut?: boolean;
  obj: T;
  hpas?: HorizontalPodAutoscalerKind[];
  pods?: PodKind[];
  previous?: PodControllerOverviewItem;
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
