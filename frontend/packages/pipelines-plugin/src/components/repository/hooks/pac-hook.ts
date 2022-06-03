import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { ConfigMapModel } from '@console/internal/models';
import { ConfigMapKind } from '@console/internal/module/k8s';
import { PAC_INFO } from '../../pac/const';
import { PIPELINE_NAMESPACE } from '../../pipelines/const';

export const usePacInfo = () =>
  useK8sGet<ConfigMapKind>(ConfigMapModel, PAC_INFO, PIPELINE_NAMESPACE);
