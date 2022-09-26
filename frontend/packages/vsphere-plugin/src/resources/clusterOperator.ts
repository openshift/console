import { K8sResourceConditionStatus } from './k8sResource';

export const CONSOLE_PREFIX_CLUSTER_OPERATOR =
  '/k8s/cluster/config.openshift.io~v1~ClusterOperator';

export type OperatorStateType = {
  progressing?: K8sResourceConditionStatus;
  degraded?: K8sResourceConditionStatus;
  available?: K8sResourceConditionStatus;
};
