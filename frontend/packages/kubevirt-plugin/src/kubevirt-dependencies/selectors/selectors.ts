import * as _ from 'lodash';
import { PodKind } from '@console/internal/module/k8s';

export const getNodeName = (pod: PodKind): PodKind['spec']['nodeName'] =>
  pod && pod.spec ? pod.spec.nodeName : undefined;

export const getValueByPrefix = (obj = {}, keyPrefix: string): string => {
  const objectKey = Object.keys(obj).find((key) => key.startsWith(keyPrefix));
  return objectKey ? obj[objectKey] : null;
};

export const isConditionStatusTrue = (condition) => (condition && condition.status) === 'True';

export const getStorageSize = (value): string => _.get(value, 'requests.storage');
