import * as React from 'react';
import {
  GraphElement,
  ComponentFactory,
} from '@patternfly/react-topology';
import { withEditReviewAccess } from '@console/topology/src/utils';
import {
  createConnectorCallback,
  NodeComponentProps,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  withContextMenu,
  CreateConnector,
  createMenuItems
} from '@console/topology/src/components/graph-view';
import {
  withDragNode,
  withSelection,
  withDndDrop,
  withCreateConnector,
} from '@patternfly/react-topology';
import { kebabOptionsToMenu } from '@console/internal/components/utils';
import KafkaNode from './KafkaNode';
import {
  Node,
} from '@patternfly/react-topology';
import { MANAGED_KAFKA_TOPOLOGY_TYPE } from '../rhoas-topology-plugin';
import { rhoasActions } from '../actions/rhoasActions';

export const rhoasContextMenu = (element: Node) => {
  return createMenuItems(kebabOptionsToMenu(rhoasActions(element)));
};

export const getRhoasComponentFactory = (): ComponentFactory => {
  return (kind, type): React.ComponentType<{ element: GraphElement }> | undefined => {
    switch (type) {
      // Using resource kind as model kind for simplicity
      case MANAGED_KAFKA_TOPOLOGY_TYPE:
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
                withSelection({ controlled: true })(withContextMenu(rhoasContextMenu)(KafkaNode)),
              ),
            ),
          ),
        );
      default:
        return undefined;

    }
  };
};
