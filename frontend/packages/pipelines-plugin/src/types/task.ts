import { K8sResourceCommon } from '@console/internal/module/k8s';
import { TektonTaskSpec } from './coreTekton';

export type TaskKind = K8sResourceCommon & {
  spec: TektonTaskSpec;
};
