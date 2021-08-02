import * as React from 'react';
import {
  GraphElement,
  withDragNode,
  withSelection,
  withCreateConnector,
} from '@patternfly/react-topology';
import BindableNode from '@console/dev-console/src/components/topology/components/BindableNode';
import {
  createConnectorCallback,
  nodeDragSourceSpec,
  withContextMenu,
  CreateConnector,
  noRegroupWorkloadContextMenu,
} from '@console/topology/src/components/graph-view';
import { withEditReviewAccess } from '@console/topology/src/utils';
import { TYPE_MANAGED_KAFKA_CONNECTION } from './const';

const getRhoasComponentFactory = (
  kind,
  type,
): React.ComponentType<{ element: GraphElement }> | undefined => {
  switch (type) {
    // Using resource kind as model kind for simplicity
    case TYPE_MANAGED_KAFKA_CONNECTION:
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

export default getRhoasComponentFactory;
