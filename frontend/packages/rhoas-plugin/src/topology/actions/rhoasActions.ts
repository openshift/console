import { Node } from '@patternfly/react-topology';
import { getResource } from '@console/topology/src/utils/topology-utils';
import { KebabOption } from '@console/internal/components/utils/kebab';
import { deleteManagedKafkaConnection } from '../../actions/delete-kafka-connection';

export const rhoasActions = (kafkaInstance: Node): KebabOption[] => {
  const name = kafkaInstance.getLabel();
  const { namespace } = getResource(kafkaInstance)?.metadata;
  return name && namespace ? [deleteManagedKafkaConnection(name, namespace)] : [];
};
