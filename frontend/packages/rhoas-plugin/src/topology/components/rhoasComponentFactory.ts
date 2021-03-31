import * as React from 'react';
import {
  GraphElement,
  ComponentFactory,
  withDragNode,
  withSelection,
  withCreateConnector,
} from '@patternfly/react-topology';
import { withEditReviewAccess } from '@console/topology/src/utils';
import {
  createConnectorCallback,
  nodeDragSourceSpec,
  withContextMenu,
  CreateConnector,
  noRegroupWorkloadContextMenu,
} from '@console/topology/src/components/graph-view';
import KafkaNode from './KafkaNode';
import { TYPE_MANAGED_KAFKA_CONNECTION } from './const';

export const getRhoasComponentFactory = (): ComponentFactory => {
  return (kind, type): React.ComponentType<{ element: GraphElement }> | undefined => {
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
                withContextMenu(noRegroupWorkloadContextMenu)(KafkaNode),
              ),
            ),
          ),
        );
      default:
        return undefined;
    }
  };
};
