import type {
  ExtPodKind,
  K8sResourceCommon,
  PodControllerOverviewItem,
  WatchK8sResultsObject,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { DeploymentKind, PodKind } from '@console/internal/module/k8s';

export type {
  PodRCData,
  ExtPodPhase,
  ExtPodStatus,
  ExtPodKind,
  OverviewItemAlerts,
  PodControllerOverviewItem,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';

export interface PodDataResources {
  replicationControllers: WatchK8sResultsObject<K8sResourceCommon[]>;
  replicaSets: WatchK8sResultsObject<K8sResourceCommon[]>;
  pods: WatchK8sResultsObject<PodKind[]>;
  deploymentConfigs?: WatchK8sResultsObject<K8sResourceCommon[]>;
  deployments?: WatchK8sResultsObject<DeploymentKind[]>;
}

export interface PodRingResources {
  pods: WatchK8sResultsObject<PodKind[]>;
  replicaSets: WatchK8sResultsObject<K8sResourceCommon[]>;
  replicationControllers: WatchK8sResultsObject<K8sResourceCommon[]>;
  deployments?: WatchK8sResultsObject<DeploymentKind[]>;
  deploymentConfigs?: WatchK8sResultsObject<K8sResourceCommon[]>;
}

export interface PodRingData {
  [key: string]: {
    pods: ExtPodKind[];
    current: PodControllerOverviewItem;
    previous: PodControllerOverviewItem;
    isRollingOut: boolean;
  };
}
