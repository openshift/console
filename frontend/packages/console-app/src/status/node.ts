import { isNodeReady } from '@console/dynamic-plugin-sdk/src/shared/selectors/node';
import { NodeKind } from '@console/internal/module/k8s';

export const nodeStatus = (node: NodeKind) => (isNodeReady(node) ? 'Ready' : 'Not Ready');
