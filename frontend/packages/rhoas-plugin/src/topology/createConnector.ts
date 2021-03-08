import { Node } from '@patternfly/react-topology';
import { createServiceBinding } from '@console/topology/src/operators/actions/serviceBindings';

const createServiceBindingConnection = (source: Node, target: Node) => {
  const sourceResource = source.getData().resource || source.getData().resources?.obj;
  const targetResource = target.getData().resource || target.getData().resources?.obj;

  return createServiceBinding(sourceResource, targetResource).then(() => null);
};

export const getCreateConnector = (createHints: string[]) => {
  if (
    createHints
    // Enabling hints and drop targets requires copying
    // a large amount of code from topology core.
    // createHints.includes('createServiceBinding') &&
    // !createHints.includes('operator-workload')
  ) {
    return createServiceBindingConnection;
  }
  return null;
};
