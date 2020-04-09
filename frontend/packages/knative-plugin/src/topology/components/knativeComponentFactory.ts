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
  nodeDragSourceSpec,
  withEditReviewAccess,
  nodeContextMenu,
  registerEditOperation,
} from '@console/dev-console/src/components/topology';
import {
  TYPE_EVENT_SOURCE,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KNATIVE_REVISION,
  TYPE_KNATIVE_SERVICE,
  TYPE_REVISION_TRAFFIC,
} from '../const';
import KnativeService from './groups/KnativeService';
import RevisionNode from './nodes/RevisionNode';
import TrafficLink from './edges/TrafficLink';
import EventSourceLink from './edges/EventSourceLink';
import EventSource from './nodes/EventSource';
import {
  eventSourceLinkDragSourceSpec,
  eventSourceTargetSpec,
  knativeServiceDropTargetSpec,
} from './knativeComponentUtils';

const MOVE_EV_SRC_CONNECTOR_OPERATION = 'moveeventsourceconnector';

class KnativeComponentFactory extends AbstractSBRComponentFactory {
  constructor(serviceBinding: boolean) {
    super(serviceBinding);
    registerEditOperation(MOVE_EV_SRC_CONNECTOR_OPERATION);
  }

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
            >(knativeServiceDropTargetSpec)(
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
              )(
                withContextMenu(nodeContextMenu)(
                  withDndDrop<any, any, {}, NodeComponentProps>(eventSourceTargetSpec)(EventSource),
                ),
              ),
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
          return withTargetDrag(eventSourceLinkDragSourceSpec())(EventSourceLink);
        default:
          return undefined;
      }
    };
  };
}

export default KnativeComponentFactory;
