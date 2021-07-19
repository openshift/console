import { Node } from '@patternfly/react-topology';
import i18next from 'i18next';
import {
  addResourceMenuWithoutCatalog,
  addResourceMenu,
  addGroupResourceMenu,
  disabledFilter,
  actionMapper,
} from '@console/dev-console/src/actions/add-resources';
import { MenuOptions } from '@console/dev-console/src/utils/add-resources-menu-utils';
import { errorModal } from '@console/internal/components/modals';
import { referenceForModel } from '@console/internal/module/k8s';
import { GraphData } from '@console/topology/src/topology-types';
import { getResource } from '@console/topology/src/utils';
import { addBrokers } from '../actions/add-broker';
import { addChannels } from '../actions/add-channel';
import { addEventSource } from '../actions/add-event-source';
import { addSubscription } from '../actions/add-subscription';
import { addTrigger } from '../actions/add-trigger';
import { addPubSubConnectionModal } from '../components/pub-sub/PubSubModalLauncher';
import {
  ServiceModel,
  EventingBrokerModel,
  EventingSubscriptionModel,
  EventingTriggerModel,
} from '../models';
import { isEventingChannelResourceKind } from '../utils/fetch-dynamic-eventsources-utils';
import { TYPE_EVENT_SOURCE_KAFKA } from './const';
import { createEventSourceKafkaConnection } from './knative-topology-utils';

export const getKnativeContextMenuAction = (
  graphData: GraphData,
  menu: MenuOptions,
  connectorSource?: Node,
  isGroupActions: boolean = false,
): MenuOptions => {
  if (connectorSource?.getData().type === TYPE_EVENT_SOURCE_KAFKA) {
    return [];
  }
  const knativeActions = [addEventSource, addChannels, addBrokers]
    .filter(disabledFilter)
    .map(actionMapper);
  const knativeConnectorActions = [addEventSource].filter(disabledFilter).map(actionMapper);

  if (!connectorSource && isGroupActions) {
    if (graphData.eventSourceEnabled) {
      return [...addGroupResourceMenu, ...knativeActions];
    }
  }
  if (!connectorSource) {
    if (graphData.eventSourceEnabled) {
      return [...addResourceMenu, ...knativeActions];
    }
    return menu;
  }
  const sourceKind = connectorSource?.getData().data.kind;
  if (isEventingChannelResourceKind(sourceKind)) {
    return [addSubscription(EventingSubscriptionModel, connectorSource.getData().resource)];
  }
  switch (sourceKind) {
    case referenceForModel(ServiceModel):
      return graphData.eventSourceEnabled
        ? [
            ...(isGroupActions ? addGroupResourceMenu : addResourceMenuWithoutCatalog),
            ...knativeConnectorActions,
          ]
        : menu;
    case referenceForModel(EventingBrokerModel):
      return [addTrigger(EventingTriggerModel, connectorSource.getData().resource)];
    default:
      return menu;
  }
};

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
