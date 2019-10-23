import { K8sResourceKind, PodPhase } from '@console/internal/module/k8s';

export interface Resource {
  data: K8sResourceKind[];
}

export interface PodDataResources {
  replicationControllers: Resource;
  replicaSets: Resource;
  pods: Resource;
  deploymentConfigs?: Resource;
  deployments?: Resource;
}

export interface PodRCData {
  current: PodControllerOverviewItem;
  previous: PodControllerOverviewItem;
  obj?: K8sResourceKind;
  isRollingOut: boolean;
  pods: ExtPodKind[];
}

export interface PodRingResources {
  pods: Resource;
  replicaSets: Resource;
  replicationControllers: Resource;
  deployments?: Resource;
  deploymentConfigs?: Resource;
}

export interface PodRingData {
  [key: string]: {
    pods: ExtPodKind[];
    current: PodControllerOverviewItem;
    previous: PodControllerOverviewItem;
    isRollingOut: boolean;
  };
}

export type ExtPodPhase =
  | 'Empty'
  | 'Warning'
  | 'Idle'
  | 'Not Ready'
  | 'Scaled to 0'
  | 'Autoscaled to 0'
  | 'Terminating';

export type ExtPodStatus = {
  phase: ExtPodPhase | PodPhase;
};

export type ExtPodKind = {
  status: ExtPodStatus;
} & K8sResourceKind;

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
  pods: ExtPodKind[];
};
