import { Alert } from '@console/internal/components/monitoring/types';
import { HorizontalPodAutoscalerKind, K8sResourceKind } from '@console/internal/module/k8s';
import { DEPLOYMENT_STRATEGY } from '../constants';

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
  obj: T;
  hpas?: HorizontalPodAutoscalerKind[];
  isOperatorBackedService?: boolean;
  isMonitorable?: boolean;
  monitoringAlerts?: Alert[];
};

export type DeploymentStrategy = DEPLOYMENT_STRATEGY.recreate | DEPLOYMENT_STRATEGY.rolling;

export interface ResourceType {
  request: number | string;
  requestUnit: string;
  defaultRequestUnit: string;
  limit: number | string;
  limitUnit: string;
  defaultLimitUnit: string;
}
export interface LimitsData {
  cpu: ResourceType;
  memory: ResourceType;
}
