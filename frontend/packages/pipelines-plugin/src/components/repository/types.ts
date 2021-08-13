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
};

export type RepositoryKind = K8sResourceKind & {
  spec?: {
    url: string;
    branch?: string;
    event_type?: string;
    namespace?: string;
  };
  pipelinerun_status?: RepositoryStatus[];
};
