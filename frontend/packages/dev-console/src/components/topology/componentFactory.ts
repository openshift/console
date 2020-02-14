import { ComponentType } from 'react';
import {
  GraphElement,
  ModelKind,
  Node,
  ComponentFactory as TopologyComponentFactory,
  withPanZoom,
  withDragNode,
  withTargetDrag,
  withSelection,
  withDndDrop,
  withCreateConnector,
  withRemoveConnector,
  withContextMenu,
} from '@console/topology';
import Application from './components/nodes/Application';
import ConnectsTo from './components/edges/ConnectsTo';
import EventSource from './components/nodes/EventSource';
import EventSourceLink from './components/edges/EventSourceLink';
import WorkloadNode from './components/nodes/WorkloadNode';
import GraphComponent from './components/GraphComponent';
import {
  workloadContextMenu,
  groupContextMenu,
  nodeContextMenu,
  graphContextMenu,
} from './nodeContextMenu';
import {
  graphWorkloadDropTargetSpec,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  groupWorkloadDropTargetSpec,
  edgeDragSourceSpec,
  graphEventSourceDropTargetSpec,
  createConnectorCallback,
  removeConnectorCallback,
  MOVE_CONNECTOR_DROP_TYPE,
  MOVE_EV_SRC_CONNECTOR_DROP_TYPE,
} from './componentUtils';
import './ContextMenu.scss';
import {
  TYPE_EVENT_SOURCE,
  TYPE_WORKLOAD,
  TYPE_CONNECTS_TO,
  TYPE_APPLICATION_GROUP,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_AGGREGATE_EDGE,
  TYPE_KNATIVE_SERVICE,
  TYPE_REVISION_TRAFFIC,
  TYPE_SERVICE_BINDING,
  TYPE_KNATIVE_REVISION,
  TYPE_HELM_RELEASE,
  TYPE_HELM_WORKLOAD,
  TYPE_OPERATOR_BACKED_SERVICE,
  TYPE_OPERATOR_WORKLOAD,
  TYPE_TRAFFIC_CONNECTOR,
} from './const';
import OperatorBackedService from './components/nodes/OperatorBackedService';
import KnativeService from './components/nodes/KnativeService';
import TrafficLink from './components/edges/TrafficLink';
import ServiceBinding from './components/edges/ServiceBinding';
import RevisionNode from './components/nodes/RevisionNode';
import { createConnection, createSinkConnection } from './components/createConnection';
import { withEditReviewAccess } from './withEditReviewAccess';
import HelmRelease from './components/groups/HelmRelease';
import AggregateEdge from './components/edges/AggregateEdge';
import TrafficConnector from './components/edges/TrafficConnector';

type NodeProps = {
  element: Node;
};

class ComponentFactory {
  private hasServiceBinding: boolean;

  constructor(serviceBinding: boolean) {
    this.hasServiceBinding = serviceBinding;
  }

  set serviceBinding(value: boolean) {
    this.hasServiceBinding = value;
  }

  getFactory = (): TopologyComponentFactory => {
    return (kind, type): ComponentType<{ element: GraphElement }> | undefined => {
      switch (type) {
        case TYPE_HELM_RELEASE:
          return withSelection(false, true)(HelmRelease);
        case TYPE_HELM_WORKLOAD:
          return withCreateConnector(createConnectorCallback(this.hasServiceBinding))(
            withDndDrop<
              any,
              any,
              { droppable?: boolean; hover?: boolean; canDrop?: boolean },
              NodeProps
            >(nodeDropTargetSpec)(
              withEditReviewAccess('patch')(
                withDragNode(nodeDragSourceSpec(type, false))(
                  withSelection(
                    false,
                    true,
                  )(
                    withContextMenu(
                      workloadContextMenu,
                      document.getElementById('modal-container'),
                      'odc-topology-context-menu',
                    )(WorkloadNode),
                  ),
                ),
              ),
            ),
          );
        case TYPE_APPLICATION_GROUP:
          return withDndDrop(groupWorkloadDropTargetSpec)(
            withSelection(
              false,
              true,
            )(
              withContextMenu(
                groupContextMenu,
                document.getElementById('modal-container'),
                'odc-topology-context-menu',
              )(Application),
            ),
          );
        case TYPE_OPERATOR_BACKED_SERVICE:
          return withSelection(false, true)(OperatorBackedService);
        case TYPE_OPERATOR_WORKLOAD:
          return withCreateConnector(createConnectorCallback(this.hasServiceBinding))(
            withEditReviewAccess('patch')(
              withDndDrop<
                any,
                any,
                { droppable?: boolean; hover?: boolean; canDrop?: boolean },
                NodeProps
              >(nodeDropTargetSpec)(
                withDragNode(nodeDragSourceSpec(type, false))(
                  withSelection(
                    false,
                    true,
                  )(
                    withContextMenu(
                      workloadContextMenu,
                      document.getElementById('modal-container'),
                      'odc-topology-context-menu',
                    )(WorkloadNode),
                  ),
                ),
              ),
            ),
          );
        case TYPE_KNATIVE_SERVICE:
          return withCreateConnector(createConnectorCallback(this.hasServiceBinding))(
            withDndDrop<
              any,
              any,
              { droppable?: boolean; hover?: boolean; canDrop?: boolean; dropTarget?: boolean },
              NodeProps
            >(graphEventSourceDropTargetSpec)(
              withEditReviewAccess('update')(
                withSelection(
                  false,
                  true,
                )(
                  withContextMenu(
                    nodeContextMenu,
                    document.getElementById('modal-container'),
                    'odc-topology-context-menu',
                  )(KnativeService),
                ),
              ),
            ),
          );
        case TYPE_EVENT_SOURCE:
          return withEditReviewAccess('patch')(
            withDragNode(nodeDragSourceSpec(type))(
              withSelection(
                false,
                true,
              )(
                withContextMenu(
                  nodeContextMenu,
                  document.getElementById('modal-container'),
                  'odc-topology-context-menu',
                )(EventSource),
              ),
            ),
          );
        case TYPE_KNATIVE_REVISION:
          return withDragNode(nodeDragSourceSpec(type, false))(
            withSelection(
              false,
              true,
            )(
              withContextMenu(
                nodeContextMenu,
                document.getElementById('modal-container'),
                'odc-topology-context-menu',
              )(RevisionNode),
            ),
          );
        case TYPE_REVISION_TRAFFIC:
          return TrafficLink;
        case TYPE_WORKLOAD:
          return withCreateConnector(
            createConnectorCallback(this.hasServiceBinding),
            'odc-topology-context-menu',
          )(
            withDndDrop<
              any,
              any,
              { droppable?: boolean; hover?: boolean; canDrop?: boolean },
              NodeProps
            >(nodeDropTargetSpec)(
              withEditReviewAccess('patch')(
                withDragNode(nodeDragSourceSpec(type))(
                  withSelection(
                    false,
                    true,
                  )(
                    withContextMenu(
                      workloadContextMenu,
                      document.getElementById('modal-container'),
                      'odc-topology-context-menu',
                    )(WorkloadNode),
                  ),
                ),
              ),
            ),
          );
        case TYPE_EVENT_SOURCE_LINK:
          return withTargetDrag(
            edgeDragSourceSpec(
              MOVE_EV_SRC_CONNECTOR_DROP_TYPE,
              this.hasServiceBinding,
              createSinkConnection,
            ),
          )(EventSourceLink);
        case TYPE_CONNECTS_TO:
          return withTargetDrag(
            edgeDragSourceSpec(MOVE_CONNECTOR_DROP_TYPE, this.hasServiceBinding, createConnection),
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
                  withSelection(
                    false,
                    true,
                  )(
                    withContextMenu(
                      graphContextMenu,
                      document.getElementById('modal-container'),
                      'odc-topology-context-menu',
                    )(GraphComponent),
                  ),
                ),
              );
            default:
              return undefined;
          }
      }
    };
  };
}

export default ComponentFactory;
