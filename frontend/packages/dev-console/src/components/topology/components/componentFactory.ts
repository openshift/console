import * as React from 'react';
import {
  GraphElement,
  ModelKind,
  ComponentFactory as TopologyComponentFactory,
  withPanZoom,
  withDragNode,
  withTargetDrag,
  withSelection,
  withDndDrop,
  withRemoveConnector,
} from '@console/topology';
import { Application } from './groups';
import { WorkloadNode } from './nodes';
import GraphComponent from './GraphComponent';
import { workloadContextMenu, groupContextMenu, graphContextMenu } from './nodeContextMenu';
import {
  NodeComponentProps,
  graphWorkloadDropTargetSpec,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  groupWorkloadDropTargetSpec,
  edgeDragSourceSpec,
  removeConnectorCallback,
  MOVE_CONNECTOR_DROP_TYPE,
  withContextMenu,
} from './componentUtils';
import './ContextMenu.scss';
import {
  TYPE_WORKLOAD,
  TYPE_CONNECTS_TO,
  TYPE_APPLICATION_GROUP,
  TYPE_AGGREGATE_EDGE,
  TYPE_SERVICE_BINDING,
  TYPE_TRAFFIC_CONNECTOR,
} from './const';
import { createConnection } from './createConnection';
import { withEditReviewAccess } from './withEditReviewAccess';
import { AggregateEdge, ConnectsTo, ServiceBinding, TrafficConnector } from './edges';
import { AbstractSBRComponentFactory } from './AbstractSBRComponentFactory';

class ComponentFactory extends AbstractSBRComponentFactory {
  getFactory = (): TopologyComponentFactory => {
    return (kind, type): React.ComponentType<{ element: GraphElement }> | undefined => {
      switch (type) {
        case TYPE_APPLICATION_GROUP:
          return withDndDrop(groupWorkloadDropTargetSpec)(
            withSelection(false, true)(withContextMenu(groupContextMenu)(Application)),
          );
        case TYPE_WORKLOAD:
          return this.withAddResourceConnector()(
            withDndDrop<
              any,
              any,
              { droppable?: boolean; hover?: boolean; canDrop?: boolean },
              NodeComponentProps
            >(nodeDropTargetSpec)(
              withEditReviewAccess('patch')(
                withDragNode(nodeDragSourceSpec(type))(
                  withSelection(false, true)(withContextMenu(workloadContextMenu)(WorkloadNode)),
                ),
              ),
            ),
          );
        case TYPE_CONNECTS_TO:
          return withTargetDrag(
            edgeDragSourceSpec(MOVE_CONNECTOR_DROP_TYPE, this.serviceBinding, createConnection),
          )(withRemoveConnector(removeConnectorCallback)(ConnectsTo));
        case TYPE_SERVICE_BINDING:
          return withRemoveConnector(removeConnectorCallback)(ServiceBinding);
        case TYPE_AGGREGATE_EDGE:
          return AggregateEdge;
        case TYPE_TRAFFIC_CONNECTOR:
          return TrafficConnector;
        default:
          switch (kind) {
            case ModelKind.graph:
              return withDndDrop(graphWorkloadDropTargetSpec)(
                withPanZoom()(
                  withSelection(false, true)(withContextMenu(graphContextMenu)(GraphComponent)),
                ),
              );
            default:
              return undefined;
          }
      }
    };
  };
}

export { ComponentFactory };
