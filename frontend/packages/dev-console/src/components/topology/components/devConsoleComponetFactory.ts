import * as React from 'react';
import {
  GraphElement,
  withDragNode,
  withSelection,
  withCreateConnector,
} from '@patternfly/react-topology';
import {
  createConnectorCallback,
  nodeDragSourceSpec,
  withContextMenu,
  CreateConnector,
  noRegroupWorkloadContextMenu,
} from '@console/topology/src/components/graph-view';
import BindableNode from '@console/topology/src/components/graph-view/components/nodes/trapezoidNode/BindableNode';
import { withEditReviewAccess } from '@console/topology/src/utils';
import { TYPE_BINDABLE_NODE } from '../const';

export const getDevConsoleComponentFactory = (
  kind,
  type,
): React.ComponentType<{ element: GraphElement }> | undefined => {
  switch (type) {
    case TYPE_BINDABLE_NODE:
      return withCreateConnector(
        createConnectorCallback(),
        CreateConnector,
      )(
        withEditReviewAccess('patch')(
          withDragNode(nodeDragSourceSpec(type))(
            withSelection({ controlled: true })(
              withContextMenu(noRegroupWorkloadContextMenu)(BindableNode),
            ),
          ),
        ),
      );
    default:
      return undefined;
  }
};
