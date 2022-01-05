import {
  ModelKind,
  withPanZoom,
  withDragNode,
  withTargetDrag,
  withSelection,
  withDndDrop,
  withCreateConnector,
  DragObjectWithType,
  ComponentFactory,
} from '@patternfly/react-topology';
import { contextMenuActions } from '../../../actions';
import {
  TYPE_WORKLOAD,
  TYPE_CONNECTS_TO,
  TYPE_APPLICATION_GROUP,
  TYPE_AGGREGATE_EDGE,
  TYPE_TRAFFIC_CONNECTOR,
} from '../../../const';
import { createConnection } from '../../../utils/createConnection';
import { withEditReviewAccess } from '../../../utils/withEditReviewAccess';
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
import { AggregateEdge, ConnectsTo, CreateConnector, TrafficConnector } from './edges';
import GraphComponent from './GraphComponent';
import { Application } from './groups';
import { graphContextMenu, groupContextMenu } from './nodeContextMenu';
import { WorkloadNode } from './nodes';

import './ContextMenu.scss';

export const componentFactory: ComponentFactory = (kind, type) => {
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
                withContextMenu(contextMenuActions)(WorkloadNode),
              ),
            ),
          ),
        ),
      );
    case TYPE_CONNECTS_TO:
      return withTargetDrag<DragObjectWithType>(
        edgeDragSourceSpec(MOVE_CONNECTOR_DROP_TYPE, createConnection),
      )(withContextMenu(contextMenuActions)(ConnectsTo));
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
