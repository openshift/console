import * as React from 'react';
import {
  GraphElement,
  Edge,
  ModelKind,
  withPanZoom,
  withDragNode,
  withTargetDrag,
  withSelection,
  withDndDrop,
  withCreateConnector,
  DragObjectWithType,
  isNode,
  Node,
} from '@patternfly/react-topology';
import { kebabOptionsToMenu } from '@console/internal/components/utils';
import { edgeActions } from '../actions/edgeActions';
import { Application } from './groups';
import { WorkloadNode } from './nodes';
import GraphComponent from './GraphComponent';
import {
  workloadContextMenu,
  groupContextMenu,
  graphContextMenu,
  createMenuItems,
} from './nodeContextMenu';
import {
  NodeComponentProps,
  graphDropTargetSpec,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  applicationGroupDropTargetSpec,
  edgeDragSourceSpec,
  MOVE_CONNECTOR_DROP_TYPE,
  withContextMenu,
  createConnectorCallback,
} from './componentUtils';
import {
  TYPE_WORKLOAD,
  TYPE_CONNECTS_TO,
  TYPE_APPLICATION_GROUP,
  TYPE_AGGREGATE_EDGE,
  TYPE_TRAFFIC_CONNECTOR,
} from './const';
import { createConnection } from './createConnection';
import { withEditReviewAccess } from './withEditReviewAccess';
import { AggregateEdge, ConnectsTo, CreateConnector, TrafficConnector } from './edges';

import './ContextMenu.scss';

const connectToActions = (edge: Edge) => {
  const nodes = edge
    .getController()
    .getElements()
    .filter((e) => isNode(e) && !e.isGroup()) as Node[];

  const actions = edgeActions(edge, nodes);
  return createMenuItems(kebabOptionsToMenu(actions));
};

export const componentFactory = (
  kind,
  type,
): React.ComponentType<{ element: GraphElement }> | undefined => {
  switch (type) {
    case TYPE_APPLICATION_GROUP:
      return withDndDrop(applicationGroupDropTargetSpec)(
        withSelection({ controlled: true })(withContextMenu(groupContextMenu)(Application)),
      );
    case TYPE_WORKLOAD:
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
              withSelection({ controlled: true })(
                withContextMenu(workloadContextMenu)(WorkloadNode),
              ),
            ),
          ),
        ),
      );
    case TYPE_CONNECTS_TO:
      return withEditReviewAccess('update')(
        withTargetDrag<DragObjectWithType>(
          edgeDragSourceSpec(MOVE_CONNECTOR_DROP_TYPE, createConnection),
        )(withContextMenu(connectToActions)(ConnectsTo)),
      );
    case TYPE_AGGREGATE_EDGE:
      return AggregateEdge;
    case TYPE_TRAFFIC_CONNECTOR:
      return TrafficConnector;
    default:
      switch (kind) {
        case ModelKind.graph:
          return withDndDrop(graphDropTargetSpec)(
            withPanZoom()(
              withSelection({ controlled: true })(
                withContextMenu(graphContextMenu)(GraphComponent),
              ),
            ),
          );
        default:
          return undefined;
      }
  }
};
