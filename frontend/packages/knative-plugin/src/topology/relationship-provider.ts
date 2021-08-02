import { Node } from '@patternfly/react-topology';
import { createServiceBinding } from '@console/topology/src/operators/actions/serviceBindings';
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

export const providerCreateServiceBinding = (source: Node, target: Node) => {
  const sourceResource = getResource(source);
  const targetResource = getResource(target);
  return createServiceBinding(sourceResource, targetResource).then(() => null);
};
