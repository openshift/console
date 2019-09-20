import { get } from 'lodash';
import { PodKind } from '@console/internal/module/k8s';

export const getNodeName = (pod: PodKind) =>
  get(pod, 'spec.nodeName') as PodKind['spec']['nodeName'];
