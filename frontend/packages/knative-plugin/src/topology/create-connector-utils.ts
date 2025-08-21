import { Node } from '@patternfly/react-topology/src/types';
import i18next from 'i18next';
import { errorModal } from '@console/internal/components/modals';
import { getResource } from '@console/topology/src/utils';
import { usePubSubModalLauncher } from '../components/pub-sub/PubSubController';
import { createEventSourceKafkaConnection } from './knative-topology-utils';

const createKafkaConnection = (source: Node, target: Node) =>
  createEventSourceKafkaConnection(source, target)
    .then(() => null)
    .catch((error) => {
      errorModal({
        title: i18next.t('knative-plugin~Error moving event source kafka connector'),
        error: error.message,
        showIcon: true,
      });
    });

export const useCreateConnector = (createHints: string, source: Node, target: Node) => {
  const pubSubModalLauncher = usePubSubModalLauncher({
    source: getResource(source),
    target: getResource(target),
  });
  if (createHints.includes('createKafkaConnection')) {
    return createKafkaConnection;
  }
  if (createHints.includes('createTrigger') || createHints.includes('createSubscription')) {
    return Promise.resolve(pubSubModalLauncher).then(() => null);
  }
  return null;
};
