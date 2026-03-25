import type { Node } from '@patternfly/react-topology';
import { getResource } from '@console/topology/src/utils';
import { TYPE_KNATIVE_SERVICE } from './const';

export const providerProvidesServiceBinding = (source: Node, target: Node) => {
  if (!source || !target) return false;
  const sourceObj = getResource(source);
  const targetObj = getResource(target);
  return (
    sourceObj &&
    targetObj &&
    sourceObj !== targetObj &&
    source.getData()?.type === TYPE_KNATIVE_SERVICE &&
    targetObj.metadata?.labels?.['app.kubernetes.io/component'] === 'external-service'
  );
};
