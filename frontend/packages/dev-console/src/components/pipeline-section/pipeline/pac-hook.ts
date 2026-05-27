import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { ConfigMapModel } from '@console/internal/models';
import type { ConfigMapKind } from '@console/internal/module/k8s';

export const PAC_INFO = 'pipelines-as-code-info';
export const PIPELINE_NAMESPACE = 'openshift-pipelines';

export const usePacInfo = () =>
  useK8sGet<ConfigMapKind>(ConfigMapModel, PAC_INFO, PIPELINE_NAMESPACE);
