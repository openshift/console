import type { ComponentType } from 'react';
import type { GraphElement } from '@patternfly/react-topology';
import { withDragNode, withSelection, withDndDrop } from '@patternfly/react-topology';
import { contextMenuActions } from '@console/topology/src/actions/contextMenuActions';
import { withCreateConnector } from '@console/topology/src/behavior';
import type { NodeComponentProps } from '@console/topology/src/components/graph-view';
import {
  WorkloadNode,
  createConnectorCallback,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  withContextMenu,
  withNoDrop,
  CreateConnector,
  noRegroupDragSourceSpec,
} from '@console/topology/src/components/graph-view';
import { withEditReviewAccess } from '@console/topology/src/utils';
import { TYPE_HELM_RELEASE, TYPE_HELM_WORKLOAD } from './const';
import HelmRelease from './HelmRelease';

export const getHelmComponentFactory = (
  kind,
  type,
): ComponentType<{ element: GraphElement }> | undefined => {
  switch (type) {
    case TYPE_HELM_RELEASE:
      return withSelection({ controlled: true })(
        withContextMenu(contextMenuActions)(
          withNoDrop()(withDragNode(noRegroupDragSourceSpec)(HelmRelease)),
        ),
      );
    case TYPE_HELM_WORKLOAD:
      return withCreateConnector(
        createConnectorCallback(),
        CreateConnector,
      )(
        withDndDrop<
          any,
          any,
          { droppable?: boolean; hover?: boolean; canDrop?: boolean },
          NodeComponentProps
        >(nodeDropTargetSpec)(
          withEditReviewAccess('patch')(
            withDragNode(nodeDragSourceSpec(type, false))(
              withSelection({ controlled: true })(
                withContextMenu(contextMenuActions)(WorkloadNode),
              ),
            ),
          ),
        ),
      );
    default:
      return undefined;
  }
};
