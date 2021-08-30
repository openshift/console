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
  sync_status?: string[];
  last_deployed?: string[];
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

export interface GitOpsEnvironmentService extends GitOpsHealthResources {
  source?: { url?: string; type?: string; icon?: React.ReactNode };
  images?: string[];
  resources?: GitOpsResource[];
  workloadKind?: string;
  image?: string;
  podRing?: React.ReactNode;
  commitDetails?: React.ReactNode;
  serviceStatus?: string;
}

export interface GitOpsHealthResources {
  name: string;
  health?: string;
  status?: string;
}

export interface GitOpsRevisionMetadata {
  author: string;
  message: string;
  revision: string;
}

export interface GitOpsEnvironment {
  cluster?: string;
  environment: string;
  timestamp?: React.ReactNode;
  services: GitOpsEnvironmentService[];
  secrets?: GitOpsHealthResources[];
  deployments?: GitOpsHealthResources[];
  routes?: GitOpsHealthResources[];
  roleBindings?: GitOpsHealthResources[];
  clusterRoles?: GitOpsHealthResources[];
  clusterRoleBindings?: GitOpsHealthResources[];
  status?: string;
  revision?: GitOpsRevisionMetadata;
  lastDeployed?: string;
}

export interface CommitData {
  author: string;
  timestamp: string;
  id: string;
  msg: string;
  ref: string;
}
