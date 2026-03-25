import type {
  ExtPodKind,
  PodControllerOverviewItem,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { FirehoseResult } from '@console/internal/components/utils/types';
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
  replicationControllers: FirehoseResult;
  replicaSets: FirehoseResult;
  pods: FirehoseResult<PodKind[]>;
  deploymentConfigs?: FirehoseResult;
  deployments?: FirehoseResult<DeploymentKind[]>;
}

export interface PodRingResources {
  pods: FirehoseResult<PodKind[]>;
  replicaSets: FirehoseResult;
  replicationControllers: FirehoseResult;
  deployments?: FirehoseResult<DeploymentKind[]>;
  deploymentConfigs?: FirehoseResult;
}

export interface PodRingData {
  [key: string]: {
    pods: ExtPodKind[];
    current: PodControllerOverviewItem;
    previous: PodControllerOverviewItem;
    isRollingOut: boolean;
  };
}
