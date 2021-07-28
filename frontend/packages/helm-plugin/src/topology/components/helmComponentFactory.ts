import * as React from 'react';
import {
  GraphElement,
  withDragNode,
  withSelection,
  withDndDrop,
  withCreateConnector,
} from '@patternfly/react-topology';
import { contextMenuActions } from '@console/topology/src/actions/contextMenuActions';
import {
  WorkloadNode,
  noRegroupWorkloadContextMenu,
  createConnectorCallback,
  NodeComponentProps,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  withContextMenu,
  withNoDrop,
  CreateConnector,
} from '@console/topology/src/components/graph-view';
import { withEditReviewAccess } from '@console/topology/src/utils';
import { TYPE_HELM_RELEASE, TYPE_HELM_WORKLOAD } from './const';
import HelmRelease from './HelmRelease';

export const getHelmComponentFactory = (
  kind,
  type,
): React.ComponentType<{ element: GraphElement }> | undefined => {
  switch (type) {
    case TYPE_HELM_RELEASE:
      return withSelection({ controlled: true })(
        withContextMenu(contextMenuActions)(withNoDrop()(HelmRelease)),
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
                withContextMenu(noRegroupWorkloadContextMenu)(WorkloadNode),
              ),
            ),
          ),
        ),
      );
    default:
      return undefined;
  }
};
