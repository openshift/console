import { Node } from '@patternfly/react-topology';
import { serviceBindingModal } from '@console/app/src/components/modals/service-binding';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
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
  return serviceBindingModal({
    model: modelFor(referenceFor(sourceResource)),
    source: sourceResource,
    target: targetResource,
  });
};
