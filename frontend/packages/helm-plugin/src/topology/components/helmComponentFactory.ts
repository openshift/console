import type { ComponentType } from 'react';
import type { GraphElement } from '@patternfly/react-topology';
import { withDragNode, withSelection, withDndDrop } from '@patternfly/react-topology';
import { contextMenuActions } from '@console/topology/src/actions/contextMenuActions';
import { withCreateConnector } from '@console/topology/src/behavior/withCreateConnector';
import type { NodeComponentProps } from '@console/topology/src/components/graph-view/components/componentUtils';
import {
  createConnectorCallback,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  withContextMenu,
  withNoDrop,
  noRegroupDragSourceSpec,
} from '@console/topology/src/components/graph-view/components/componentUtils';
import { CreateConnector } from '@console/topology/src/components/graph-view/components/edges/CreateConnector';
import { WorkloadNode } from '@console/topology/src/components/graph-view/components/nodes/WorkloadNode';
import { withEditReviewAccess } from '@console/topology/src/utils/withEditReviewAccess';
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
