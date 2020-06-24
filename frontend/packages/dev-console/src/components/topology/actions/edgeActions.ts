import { KebabOption } from '@console/internal/components/utils/kebab';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { asAccessReview } from '@console/internal/components/utils';
import { Edge, Node } from '@console/topology';
import {
  TYPE_EVENT_SOURCE,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KNATIVE_REVISION,
  TYPE_KNATIVE_SERVICE,
  TYPE_EVENT_PUB_SUB,
  TYPE_REVISION_TRAFFIC,
} from '@console/knative-plugin/src/topology/const';
import { getTopologyResourceObject } from '../topology-utils';
import { removeConnection } from '../components/removeConnection';
import {
  TYPE_CONNECTS_TO,
  TYPE_SERVICE_BINDING,
  TYPE_TRAFFIC_CONNECTOR,
} from '../components/const';
import { moveConnectionModal } from '../components/MoveConnectionModal';

const moveConnection = (edge: Edge, availableTargets: Node[]) => {
  const resourceObj = getTopologyResourceObject(edge.getSource().getData());
  const resourceModel = modelFor(referenceFor(resourceObj));

  return {
    label: 'Move Connector',
    callback: () => {
      moveConnectionModal({ edge, availableTargets });
    },
    isDisabled: availableTargets.length <= 1,
    accessReview: asAccessReview(resourceModel, resourceObj, 'delete'),
  };
};

const deleteConnection = (edge: Edge) => {
  const resourceObj = getTopologyResourceObject(edge.getSource().getData());
  const resourceModel = modelFor(referenceFor(resourceObj));
  return {
    label: 'Delete Connector',
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
