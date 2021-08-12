import { Node } from '@patternfly/react-topology';
import i18next from 'i18next';
import { errorModal } from '@console/internal/components/modals';
import { EventSourceKafkaModel } from '@console/knative-plugin/src/models';
import { createEventSourceKafkaConnection } from '@console/knative-plugin/src/topology/knative-topology-utils';
import { getResource } from '@console/topology/src/utils';
import { KafkaConnectionModel } from '../models/rhoas';

export const providerProvidesKafkaConnection = (source: Node, target: Node) => {
  if (!source || !target) return false;
  const sourceObj = getResource(source);
  const targetObj = getResource(target);
  return (
    sourceObj &&
    targetObj &&
    sourceObj !== targetObj &&
    sourceObj.kind === EventSourceKafkaModel.kind &&
    targetObj.kind === KafkaConnectionModel.kind
  );
};

export const providerCreateKafkaConnection = (source: Node, target: Node) =>
  createEventSourceKafkaConnection(source, target)
    .then(() => null)
    .catch((error) => {
      errorModal({
        title: i18next.t('rhoas-plugin~Error moving event source kafka connector'),
        error: error.message,
        showIcon: true,
      });
    });
