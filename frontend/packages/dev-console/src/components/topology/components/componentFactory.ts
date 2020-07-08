import * as React from 'react';
import {
  GraphElement,
  ModelKind,
  withPanZoom,
  withDragNode,
  withTargetDrag,
  withSelection,
  withDndDrop,
  withCreateConnector,
  withRemoveConnector,
} from '@patternfly/react-topology';
import { Application } from './groups';
import { WorkloadNode } from './nodes';
import GraphComponent from './GraphComponent';
import { workloadContextMenu, groupContextMenu, graphContextMenu } from './nodeContextMenu';
import {
  NodeComponentProps,
  graphDropTargetSpec,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  applicationGroupDropTargetSpec,
  edgeDragSourceSpec,
  removeConnectorCallback,
  MOVE_CONNECTOR_DROP_TYPE,
  withContextMenu,
  createConnectorCallback,
} from './componentUtils';
import './ContextMenu.scss';
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
      return withTargetDrag(edgeDragSourceSpec(MOVE_CONNECTOR_DROP_TYPE, createConnection))(
        withRemoveConnector(removeConnectorCallback)(ConnectsTo),
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
