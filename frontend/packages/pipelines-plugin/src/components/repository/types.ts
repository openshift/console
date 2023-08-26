import { GitProvider } from '@console/git-service/src';
import { K8sResourceKind, SecretKind } from '@console/internal/module/k8s';
import { Condition } from '../../types';

export type RepositoryStatus = {
  completionTime?: string;
  conditions?: Condition[];
  logurl?: string;
  pipelineRunName: string;
  sha?: string;
  startTime?: string;
  title?: string;
  event_type?: string;
  target_branch?: string;
};

export type RepositoryKind = K8sResourceKind & {
  spec?: {
    url: string;
    branch?: string;
    namespace?: string;
  };
  pipelinerun_status?: RepositoryStatus[];
};

export type RepositoryFormValues = {
  name: string;
  gitProvider: GitProvider;
  gitUrl: string;
  githubAppAvailable: boolean;
  method: string;
  yamlData: string;
  showOverviewPage: boolean;
  webhook: {
    method: string;
    token: string;
    secret: string;
    url: string;
    secretObj?: SecretKind;
    user?: string;
    autoAttach?: boolean;
  };
};
