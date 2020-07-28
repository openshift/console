import { Node } from '@patternfly/react-topology';
import { MenuOptions } from '@console/dev-console/src/utils/add-resources-menu-utils';
import { addResourceMenuWithoutCatalog } from '@console/dev-console/src/actions/add-resources';
import { GraphData, getResource } from '@console/dev-console/src/components/topology';
import { referenceForModel } from '@console/internal/module/k8s';
import { addEventSource } from '../actions/add-event-source';
import { addTrigger } from '../actions/add-trigger';
import { addSubscription } from '../actions/add-subscription';
import { addPubSubConnectionModal } from '../components/pub-sub/PubSubModalLauncher';
import { isEventingChannelResourceKind } from '../utils/fetch-dynamic-eventsources-utils';
import {
  ServiceModel,
  EventingBrokerModel,
  EventingSubscriptionModel,
  EventingTriggerModel,
} from '../models';

export const getKnativeContextMenuAction = (
  graphData: GraphData,
  menu: MenuOptions,
  connectorSource?: Node,
): MenuOptions => {
  if (!connectorSource) {
    return menu;
  }
  const sourceKind = connectorSource?.getData().data.kind;
  if (isEventingChannelResourceKind(sourceKind)) {
    return [addSubscription(EventingSubscriptionModel, connectorSource.getData().resource)];
  }
  switch (sourceKind) {
    case referenceForModel(ServiceModel):
      return graphData.eventSourceEnabled
        ? [...addResourceMenuWithoutCatalog, addEventSource]
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

export const getCreateConnector = (createHints: string[]) => {
  if (createHints.includes('createTrigger') || createHints.includes('createSubscription')) {
    return createPubSubConnector;
  }
  return null;
};
