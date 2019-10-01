import { K8sResourceKind } from '@console/internal/module/k8s';
import { isNodeReady } from '@console/shared';

export const nodeStatus = (node: K8sResourceKind) => (isNodeReady(node) ? 'Ready' : 'Not Ready');
