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
import ApplicationGroup from './components/nodes/ApplicationGroup';
import ConnectsTo from './components/edges/ConnectsTo';
import EventSource from './components/nodes/EventSource';
import EventSourceLink from './components/edges/EventSourceLink';
import WorkloadNode from './components/nodes/WorkloadNode';
import GraphComponent from './components/GraphComponent';
import { workloadContextMenu, groupContextMenu, nodeContextMenu } from './nodeContextMenu';
import {
  graphWorkloadDropTargetSpec,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  groupWorkoadDropTargetSpec,
  edgeDragSourceSpec,
  createConnectorCallback,
  removeConnectorCallback,
} from './componentUtils';
import './ContextMenu.scss';
import {
  TYPE_EVENT_SOURCE,
  TYPE_WORKLOAD,
  TYPE_CONNECTS_TO,
  TYPE_APPLICATION_GROUP,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KNATIVE_SERVICE,
  TYPE_REVISION_TRAFFIC,
  TYPE_SERVICE_BINDING,
  TYPE_KNATIVE_REVISION,
} from './const';
import KnativeService from './components/nodes/KnativeService';
import TrafficLink from './components/edges/TrafficLink';
import ServiceBinding from './components/edges/ServiceBinding';
import RevisionNode from './components/nodes/RevisionNode';

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
        case TYPE_APPLICATION_GROUP:
          return withDndDrop(groupWorkoadDropTargetSpec)(
            withDragNode()(
              withSelection(false, true)(
                withContextMenu(
                  groupContextMenu,
                  document.getElementById('modal-container'),
                  'odc2-topology-context-menu',
                )(ApplicationGroup),
              ),
            ),
          );
        case TYPE_KNATIVE_SERVICE:
          return withDragNode(nodeDragSourceSpec(type))(
            withSelection(false, true)(
              withContextMenu(
                nodeContextMenu,
                document.getElementById('modal-container'),
                'odc2-topology-context-menu',
              )(KnativeService),
            ),
          );
        case TYPE_EVENT_SOURCE:
          return withDragNode(nodeDragSourceSpec(type))(
            withSelection(false, true)(
              withContextMenu(
                nodeContextMenu,
                document.getElementById('modal-container'),
                'odc2-topology-context-menu',
              )(EventSource),
            ),
          );
        case TYPE_KNATIVE_REVISION:
          return withDragNode(nodeDragSourceSpec(type, false))(
            withSelection(false, true)(
              withContextMenu(
                nodeContextMenu,
                document.getElementById('modal-container'),
                'odc2-topology-context-menu',
              )(RevisionNode),
            ),
          );
        case TYPE_REVISION_TRAFFIC:
          return TrafficLink;
        case TYPE_WORKLOAD:
          return withCreateConnector(createConnectorCallback(this.hasServiceBinding))(
            withDndDrop<
              any,
              any,
              { droppable?: boolean; hover?: boolean; canDrop?: boolean },
              NodeProps
            >(nodeDropTargetSpec)(
              withDragNode(nodeDragSourceSpec(type))(
                withSelection(false, true)(
                  withContextMenu(
                    workloadContextMenu,
                    document.getElementById('modal-container'),
                    'odc2-topology-context-menu',
                  )(WorkloadNode),
                ),
              ),
            ),
          );
        case TYPE_EVENT_SOURCE_LINK:
          return EventSourceLink;
        case TYPE_CONNECTS_TO:
          return withTargetDrag(edgeDragSourceSpec(this.hasServiceBinding))(
            withRemoveConnector(removeConnectorCallback)(ConnectsTo),
          );
        case TYPE_SERVICE_BINDING:
          return withRemoveConnector(removeConnectorCallback)(ServiceBinding);
        default:
          switch (kind) {
            case ModelKind.graph:
              return withDndDrop(graphWorkloadDropTargetSpec)(
                withPanZoom()(withSelection(false, true)(GraphComponent)),
              );
            default:
              return undefined;
          }
      }
    };
  };
}

export default ComponentFactory;
