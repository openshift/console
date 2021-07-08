import { Edge, Node } from '@patternfly/react-topology';
import { asAccessReview } from '@console/internal/components/utils';
import { KebabOption } from '@console/internal/components/utils/kebab';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import {
  TYPE_EVENT_SOURCE,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KNATIVE_REVISION,
  TYPE_KNATIVE_SERVICE,
  TYPE_EVENT_PUB_SUB,
  TYPE_REVISION_TRAFFIC,
  TYPE_KAFKA_CONNECTION_LINK,
} from '@console/knative-plugin/src/topology/const';
import { TYPE_MANAGED_KAFKA_CONNECTION } from '@console/rhoas-plugin/src/topology/components/const';
import { moveConnectionModal } from '../components/modals/MoveConnectionModal';
import { TYPE_CONNECTS_TO, TYPE_SERVICE_BINDING, TYPE_TRAFFIC_CONNECTOR } from '../const';
import { removeConnection } from '../utils';
import { getResource } from '../utils/topology-utils';

const moveConnection = (edge: Edge, availableTargets: Node[]) => {
  const resourceObj = getResource(edge.getSource());
  const resourceModel = modelFor(referenceFor(resourceObj));

  return {
    // t('topology~Move connector')
    labelKey: 'topology~Move connector',
    callback: () => {
      moveConnectionModal({ edge, availableTargets });
    },
    isDisabled: availableTargets.length <= 1,
    accessReview: asAccessReview(resourceModel, resourceObj, 'delete'),
  };
};

const deleteConnection = (edge: Edge) => {
  const resourceObj = getResource(edge.getSource());
  const resourceModel = modelFor(referenceFor(resourceObj));
  return {
    // t('topology~Delete connector')
    labelKey: 'topology~Delete connector',
    callback: () => {
      removeConnection(edge);
    },
    accessReview: asAccessReview(resourceModel, resourceObj, 'delete'),
  };
};

export const edgeActions = (edge: Edge, nodes: Node[]): KebabOption[] => {
  const actions: KebabOption[] = [];
  const currentTargets = edge
    .getSource()
    .getSourceEdges()
    .map((e) => e.getTarget().getId());

  const availableTargets = nodes
    .filter((n) => {
      if (n.getId() === edge.getSource().getId()) {
        return false;
      }
      if (n.getId() !== edge.getTarget().getId() && currentTargets.includes(n.getId())) {
        return false;
      }
      if (n.getType() === TYPE_EVENT_SOURCE) {
        return false;
      }
      switch (edge.getType()) {
        case TYPE_CONNECTS_TO:
          return n.getType() !== TYPE_KNATIVE_REVISION && n.getType() !== TYPE_KNATIVE_SERVICE;
        case TYPE_SERVICE_BINDING:
          return false;
        case TYPE_EVENT_SOURCE_LINK:
          return n.getType() === TYPE_KNATIVE_SERVICE || n.getType() === TYPE_EVENT_PUB_SUB;
        case TYPE_REVISION_TRAFFIC:
          return false;
        case TYPE_TRAFFIC_CONNECTOR:
          return false;
        case TYPE_KAFKA_CONNECTION_LINK:
          return n.getType() === TYPE_MANAGED_KAFKA_CONNECTION;
        default:
          return true;
      }
    })
    .sort((n1, n2) => n1.getLabel().localeCompare(n2.getLabel()));

  actions.push(moveConnection(edge, availableTargets));

  switch (edge.getType()) {
    case TYPE_CONNECTS_TO:
    case TYPE_SERVICE_BINDING:
      actions.push(deleteConnection(edge));
      break;
    default:
      break;
  }

  return actions;
};
