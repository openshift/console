import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { PodControllerOverviewItem } from './resource';

export interface Pod extends PodKind {
  id?: string;
  name?: string;
}

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
  pods: PodKind[];
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
    pods: PodKind[];
    current: PodControllerOverviewItem;
    previous: PodControllerOverviewItem;
    isRollingOut: boolean;
  };
}
