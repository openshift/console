import {
  DeploymentConfigModel,
  DaemonSetModel,
  StatefulSetModel,
  CronJobModel,
  DeploymentModel,
  JobModel,
} from '@console/internal/models';

export interface GitOpsAppGroupData {
  name: string;
  environments: string[];
  repo_url?: string;
}

export interface GitOpsManifestData {
  applications: GitOpsAppGroupData[];
}

export const WORKLOAD_KINDS = [
  DeploymentModel.kind,
  DeploymentConfigModel.kind,
  DaemonSetModel.kind,
  StatefulSetModel.kind,
  JobModel.kind,
  CronJobModel.kind,
];

export interface GitOpsResource {
  group: string;
  version: string;
  kind: string;
  name: string;
  namespace: string;
}

export interface GitOpsEnvironmentService {
  name: string;
  source?: { url?: string; type?: string; icon?: React.ReactNode };
  images: string[];
  resources: GitOpsResource[];
  workloadKind?: string;
  image?: string;
  podRing?: React.ReactNode;
  commitDetails?: React.ReactNode;
}

export interface GitOpsEnvironment {
  cluster?: string;
  environment: string;
  timestamp?: React.ReactNode;
  services: GitOpsEnvironmentService[];
}

export interface CommitData {
  author: string;
  timestamp: string;
  id: string;
}
