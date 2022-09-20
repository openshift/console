export const CONSOLE_PREFIX_CLUSTER_OPERATOR =
  '/k8s/cluster/config.openshift.io~v1~ClusterOperator';

export type BooleanString = 'True' | 'False';

export type OperatorStateType = {
  progressing?: BooleanString;
  degraded?: BooleanString;
  available?: BooleanString;
};
