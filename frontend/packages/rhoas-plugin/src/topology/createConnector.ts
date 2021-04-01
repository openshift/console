import { Node } from '@patternfly/react-topology';
import { createServiceBinding } from '@console/topology/src/operators/actions/serviceBindings';
import { TYPE_MANAGED_KAFKA_CONNECTION } from './components/const';

const createServiceBindingConnection = (source: Node, target: Node) => {
  const sourceResource = source.getData().resource || source.getData().resources?.obj;
  const targetResource = target.getData().resource || target.getData().resources?.obj;

  return createServiceBinding(sourceResource, targetResource).then(() => null);
};

export const getCreateConnector = (createHints: string[], source: Node, target: Node) => {
  if (
    createHints &&
    createHints.includes('createServiceBinding') &&
    target.getType() === TYPE_MANAGED_KAFKA_CONNECTION
  ) {
    return createServiceBindingConnection;
  }
  return null;
};
