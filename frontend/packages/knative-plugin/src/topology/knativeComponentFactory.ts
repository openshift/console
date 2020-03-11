import * as React from 'react';
import {
  GraphElement,
  ComponentFactory as TopologyComponentFactory,
  withDragNode,
  withTargetDrag,
  withSelection,
  withDndDrop,
} from '@console/topology';
import {
  AbstractSBRComponentFactory,
  NodeComponentProps,
  withContextMenu,
  withNoDrop,
  edgeDragSourceSpec,
  graphEventSourceDropTargetSpec,
  MOVE_EV_SRC_CONNECTOR_DROP_TYPE,
  nodeDragSourceSpec,
  withEditReviewAccess,
  nodeContextMenu,
} from '@console/dev-console/src/components/topology';
import {
  TYPE_EVENT_SOURCE,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KNATIVE_REVISION,
  TYPE_KNATIVE_SERVICE,
  TYPE_REVISION_TRAFFIC,
} from './const';
import KnativeService from './components/groups/KnativeService';
import RevisionNode from './components/nodes/RevisionNode';
import TrafficLink from './components/edges/TrafficLink';
import EventSourceLink from './components/edges/EventSourceLink';
import EventSource from './components/nodes/EventSource';
import { createSinkConnection } from './knative-topology-utils';

class KnativeComponentFactory extends AbstractSBRComponentFactory {
  getFactory = (): TopologyComponentFactory => {
    return (kind, type): React.ComponentType<{ element: GraphElement }> | undefined => {
      switch (type) {
        case TYPE_KNATIVE_SERVICE:
          return this.withAddResourceConnector()(
            withDndDrop<
              any,
              any,
              { droppable?: boolean; hover?: boolean; canDrop?: boolean; dropTarget?: boolean },
              NodeComponentProps
            >(graphEventSourceDropTargetSpec)(
              withEditReviewAccess('update')(
                withSelection(false, true)(withContextMenu(nodeContextMenu)(KnativeService)),
              ),
            ),
          );
        case TYPE_EVENT_SOURCE:
          return withEditReviewAccess('patch')(
            withDragNode(nodeDragSourceSpec(type))(
              withSelection(
                false,
                true,
              )(withContextMenu(nodeContextMenu)(withNoDrop()(EventSource))),
            ),
          );
        case TYPE_KNATIVE_REVISION:
          return withDragNode(nodeDragSourceSpec(type, false))(
            withSelection(
              false,
              true,
            )(withContextMenu(nodeContextMenu)(withNoDrop()(RevisionNode))),
          );
        case TYPE_REVISION_TRAFFIC:
          return TrafficLink;
        case TYPE_EVENT_SOURCE_LINK:
          return withTargetDrag(
            edgeDragSourceSpec(
              MOVE_EV_SRC_CONNECTOR_DROP_TYPE,
              this.serviceBinding,
              createSinkConnection,
            ),
          )(EventSourceLink);
        default:
          return undefined;
      }
    };
  };
}

export default KnativeComponentFactory;
