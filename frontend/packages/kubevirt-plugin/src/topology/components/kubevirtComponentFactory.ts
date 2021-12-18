import * as React from 'react';
import {
  GraphElement,
  withCreateConnector,
  withDndDrop,
  withDragNode,
  withSelection,
} from '@patternfly/react-topology';
import { contextMenuActions } from '@console/topology/src/actions';
import {
  CreateConnector,
  createConnectorCallback,
  NodeComponentProps,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  withContextMenu,
} from '@console/topology/src/components/graph-view';
import { withEditReviewAccess } from '@console/topology/src/utils';
import { TYPE_VIRTUAL_MACHINE } from './const';
import { VmNode } from './nodes/VmNode';

export const getKubevirtComponentFactory = (
  kind,
  type,
): React.ComponentType<{ element: GraphElement }> | undefined => {
  switch (type) {
    case TYPE_VIRTUAL_MACHINE:
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
            withDragNode(nodeDragSourceSpec(type))(
              withSelection({ controlled: true })(withContextMenu(contextMenuActions)(VmNode)),
            ),
          ),
        ),
      );
    default:
      return undefined;
  }
};
