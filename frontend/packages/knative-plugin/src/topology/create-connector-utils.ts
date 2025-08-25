import { Node } from '@patternfly/react-topology/src/types';
import i18next from 'i18next';
import { errorModal } from '@console/internal/components/modals';
import { getResource } from '@console/topology/src/utils';
import { addPubSubConnectionModal } from '../components/pub-sub/PubSubModalLauncher';
import { createEventSourceKafkaConnection } from './knative-topology-utils';

const createPubSubConnector = (source: Node, target: Node) => {
  return Promise.resolve(
    addPubSubConnectionModal({ source: getResource(source), target: getResource(target) }),
  ).then(() => null);
};

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

export const getCreateConnector = (createHints: string[]) => {
  if (createHints.includes('createKafkaConnection')) {
    return createKafkaConnection;
  }
  if (createHints.includes('createTrigger') || createHints.includes('createSubscription')) {
    return createPubSubConnector;
  }
  return null;
};
