import { Node } from '@patternfly/react-topology';
import { TYPE_WORKLOAD } from '@console/topology/src/const';
import { createServiceBinding } from '@console/topology/src/operators/actions/serviceBindings';
import { getResource } from '@console/topology/src/utils';

export const providerProvidesServiceBinding = (source: Node, target: Node) => {
  if (!source || !target) return false;
  const sourceObj = getResource(source);
  const targetObj = getResource(target);
  return (
    sourceObj &&
    targetObj &&
    sourceObj !== targetObj &&
    source.getData()?.type === TYPE_WORKLOAD &&
    targetObj.metadata?.labels?.['app.kubernetes.io/component'] === 'external-service'
  );
};

export const providerCreateServiceBinding = (source: Node, target: Node) => {
  const sourceResource = getResource(source);
  const targetResource = getResource(target);
  return createServiceBinding(sourceResource, targetResource).then(() => null);
};
