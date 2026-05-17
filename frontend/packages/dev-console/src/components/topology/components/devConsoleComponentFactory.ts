import type { ComponentType } from 'react';
import type { GraphElement } from '@patternfly/react-topology';
import { withDragNode, withSelection } from '@patternfly/react-topology';
import { contextMenuActions } from '@console/topology/src/actions/contextMenuActions';
import { withCreateConnector } from '@console/topology/src/behavior/withCreateConnector';
import {
  createConnectorCallback,
  nodeDragSourceSpec,
  withContextMenu,
} from '@console/topology/src/components/graph-view/components/componentUtils';
import { CreateConnector } from '@console/topology/src/components/graph-view/components/edges/CreateConnector';
import BindableNode from '@console/topology/src/components/graph-view/components/nodes/BindableNode';
import { withEditReviewAccess } from '@console/topology/src/utils/withEditReviewAccess';
import { TYPE_BINDABLE_NODE } from '../const';

export const getDevConsoleComponentFactory = (
  kind,
  type,
): ComponentType<{ element: GraphElement }> | undefined => {
  switch (type) {
    case TYPE_BINDABLE_NODE:
      return withCreateConnector(
        createConnectorCallback(),
        CreateConnector,
      )(
        withEditReviewAccess('patch')(
          withDragNode(nodeDragSourceSpec(type))(
            withSelection({ controlled: true })(withContextMenu(contextMenuActions)(BindableNode)),
          ),
        ),
      );
    default:
      return undefined;
  }
};
