import { K8sResourceKind } from '@console/internal/module/k8s';
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
