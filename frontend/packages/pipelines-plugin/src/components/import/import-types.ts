import { K8sResourceKind } from '@console/internal/module/k8s';

export interface PipelineData {
  enabled: boolean;
  template?: K8sResourceKind;
}
