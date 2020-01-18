import { KebabOption } from '@console/internal/components/utils/kebab';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { asAccessReview } from '@console/internal/components/utils';
import { BaseEdge, Node } from '@console/topology';
import { getTopologyResourceObject } from '../topology-utils';
import { removeConnection } from '../components/removeConnection';
import {
  TYPE_CONNECTS_TO,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KNATIVE_REVISION,
  TYPE_KNATIVE_SERVICE,
  TYPE_REVISION_TRAFFIC,
  TYPE_SERVICE_BINDING,
} from '../const';
import { moveConnectionModal } from '../components/MoveConnectionModal';

const moveConnection = (edge: BaseEdge, availableTargets: Node[]) => {
  const resourceObj = getTopologyResourceObject(edge.getSource().getData());
  const resourceModel = modelFor(referenceFor(resourceObj));

  return {
    label: 'Move Connector',
    callback: () => {
      moveConnectionModal({ edge, availableTargets });
    },
    accessReview: asAccessReview(resourceModel, resourceObj, 'delete'),
  };
};

const deleteConnection = (edge: BaseEdge) => {
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

export const edgeActions = (edge: BaseEdge, nodes: Node[]): KebabOption[] => {
  const actions: KebabOption[] = [];

  const availableTargets = nodes
    .filter((n) => {
      switch (edge.getType()) {
        case TYPE_CONNECTS_TO:
          return n.getType() !== TYPE_KNATIVE_REVISION && n.getType() !== TYPE_KNATIVE_SERVICE;
        case TYPE_SERVICE_BINDING:
          return false;
        case TYPE_EVENT_SOURCE_LINK:
          return n.getType() === TYPE_KNATIVE_SERVICE;
        case TYPE_REVISION_TRAFFIC:
          return false;
        default:
          return true;
      }
    })
    .sort((n1, n2) => n1.getLabel().localeCompare(n2.getLabel()));

  if (availableTargets.length > 1) {
    actions.push(moveConnection(edge, availableTargets));
  }

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
