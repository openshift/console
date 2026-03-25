import { useMemo } from 'react';
import { ButtonVariant } from '@patternfly/react-core';
import type { Edge, Node } from '@patternfly/react-topology';
import { isNode } from '@patternfly/react-topology';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import type { Action, K8sModel } from '@console/dynamic-plugin-sdk';
import { asAccessReview } from '@console/internal/components/utils';
import {
  TYPE_EVENT_SOURCE,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KNATIVE_REVISION,
  TYPE_KNATIVE_SERVICE,
  TYPE_EVENT_PUB_SUB,
  TYPE_REVISION_TRAFFIC,
  TYPE_KAFKA_CONNECTION_LINK,
  TYPE_MANAGED_KAFKA_CONNECTION,
} from '@console/knative-plugin/src/topology/const';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { launchErrorModal } from '@console/shared/src/utils/error-modal-handler';
import { useMoveConnectionModalLauncher } from '../components/modals/MoveConnectionModal';
import { TYPE_CONNECTS_TO, TYPE_TRAFFIC_CONNECTOR } from '../const';
import { removeTopologyResourceConnection, getResource } from '../utils/topology-utils';

const getAvailableTargetForEdge = (edge: Edge, nodes: Node[]) => {
  const currentTargets = edge
    ?.getSource?.()
    ?.getSourceEdges()
    ?.map((e) => e?.getTarget()?.getId());

  return nodes
    .filter((n) => {
      if (n.getId() === edge?.getSource?.().getId()) {
        return false;
      }
      if (n.getId() !== edge?.getTarget?.().getId() && currentTargets?.includes(n.getId())) {
        return false;
      }
      if (n.getType() === TYPE_EVENT_SOURCE) {
        return false;
      }
      switch (edge.getType()) {
        case TYPE_CONNECTS_TO:
          return n.getType() !== TYPE_KNATIVE_REVISION && n.getType() !== TYPE_KNATIVE_SERVICE;
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
};

export const useMoveConnectorAction = (
  kindObj: K8sModel,
  element: Edge,
  resourceObj?: any,
): Action => {
  const resource = resourceObj || getResource(element?.getSource?.());

  const nodes = element
    .getController()
    .getElements()
    .filter((e) => isNode(e) && !e.isGroup()) as Node[];
  const availableTargets = element && getAvailableTargetForEdge(element, nodes);
  const moveConnectionModalLauncher = useMoveConnectionModalLauncher({
    edge: element,
    availableTargets,
  });
  return useMemo(
    () => ({
      id: 'move-visual-connector',
      label: i18next.t('topology~Move connector'),
      cta: moveConnectionModalLauncher,
      disabled: availableTargets.length <= 1,
      accessReview: asAccessReview(kindObj, resource, 'delete'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [availableTargets.length, kindObj, resource],
  );
};

export const useDeleteConnectorAction = (
  kindObj: K8sModel,
  element: Edge,
  resourceObj?: any,
): Action => {
  const resource = resourceObj || getResource(element.getSource?.());
  const { t } = useTranslation();

  const openConfirm = useWarningModal({
    title: t('topology~Delete Connector?'),
    children: t(
      'topology~Deleting the visual connector removes the `connects-to` annotation from the resources. Are you sure you want to delete the visual connector?',
    ),
    confirmButtonLabel: t('topology~Delete'),
    confirmButtonVariant: ButtonVariant.danger,
    onConfirm: () => {
      return removeTopologyResourceConnection(element, resource).catch((err) => {
        if (err) {
          launchErrorModal({
            title: t('topology~Error deleting connector'),
            error: err.message,
          });
        }
      });
    },
    ouiaId: 'TopologyDeleteConnectorConfirmation',
  });

  return useMemo(
    () => ({
      id: 'delete-connector',
      label: t('topology~Delete connector'),
      cta: () => openConfirm(),
      accessReview: asAccessReview(kindObj, resource, 'delete'),
    }),
    // missing openConfirm dependency, that causes max depth exceeded error
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kindObj, resource, t],
  );
};
