import { DeploymentKind, K8sResourceKind, PodKind, PodPhase } from '@console/internal/module/k8s';
import { FirehoseResult } from '@console/internal/components/utils';
import { AllPodStatus } from '../constants';

export interface PodDataResources {
  replicationControllers: FirehoseResult;
  replicaSets: FirehoseResult;
  pods: FirehoseResult<PodKind[]>;
  deploymentConfigs?: FirehoseResult;
  deployments?: FirehoseResult<DeploymentKind[]>;
}

export interface PodRCData {
  current: PodControllerOverviewItem;
  previous: PodControllerOverviewItem;
  obj?: K8sResourceKind;
  isRollingOut: boolean;
  pods: ExtPodKind[];
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

export type ExtPodPhase =
  | AllPodStatus.Empty
  | AllPodStatus.Warning
  | AllPodStatus.Idle
  | AllPodStatus.NotReady
  | AllPodStatus.ScaledTo0
  | AllPodStatus.AutoScaledTo0
  | AllPodStatus.Terminating
  | AllPodStatus.ScalingUp;

export type ExtPodStatus = {
  phase: ExtPodPhase | PodPhase;
};

export type ExtPodKind = {
  status?: ExtPodStatus;
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
