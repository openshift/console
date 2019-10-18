import { NodeKind } from '@console/internal/module/k8s';
import { isNodeReady } from '@console/shared';

export const nodeStatus = (node: NodeKind) => (isNodeReady(node) ? 'Ready' : 'Not Ready');
