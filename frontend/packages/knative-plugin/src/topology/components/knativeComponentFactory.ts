import * as React from 'react';
import {
  GraphElement,
  withDragNode,
  withTargetDrag,
  withSelection,
  withDndDrop,
} from '@patternfly/react-topology';
import { ViewComponentFactory } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { contextMenuActions } from '@console/topology/src/actions';
import { withCreateConnector } from '@console/topology/src/behavior';
import {
  NodeComponentProps,
  withContextMenu,
  withNoDrop,
  nodeDragSourceSpec,
  createConnectorCallback,
  CreateConnector,
  EditableDragOperationType,
  BaseEdge,
} from '@console/topology/src/components/graph-view';
import { withEditReviewAccess } from '@console/topology/src/utils';
import {
  TYPE_EVENT_SOURCE,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KNATIVE_REVISION,
  TYPE_KNATIVE_SERVICE,
  TYPE_REVISION_TRAFFIC,
  TYPE_EVENT_PUB_SUB,
  TYPE_EVENT_PUB_SUB_LINK,
  TYPE_SINK_URI,
  TYPE_EVENT_SOURCE_KAFKA,
  TYPE_KAFKA_CONNECTION_LINK,
  TYPE_EVENT_SINK,
  TYPE_EVENT_SINK_LINK,
  TYPE_KAFKA_SINK,
} from '../const';
import EventingPubSubLink from './edges/EventingPubSubLink';
import EventSinkLink from './edges/EventSinkLink';
import EventSourceLink from './edges/EventSourceLink';
import TrafficLink from './edges/TrafficLink';
import KnativeService from './groups/KnativeService';
import {
  eventSourceLinkDragSourceSpec,
  eventingPubSubLinkDragSourceSpec,
  eventSourceTargetSpec,
  eventSourceSinkDropTargetSpec,
  sinkUriDropTargetSpec,
  pubSubDropTargetSpec,
  CREATE_PUB_SUB_CONNECTOR_OPERATION,
  eventSourceKafkaLinkDragSourceSpec,
  CREATE_EV_SRC_KAFKA_CONNECTOR_OPERATION,
  kafkaSourceCreateConnectorCallback,
} from './knativeComponentUtils';
import EventingPubSubNode from './nodes/EventingPubSubNode';
import EventSink from './nodes/EventSink';
import EventSource from './nodes/EventSource';
import RevisionNode from './nodes/RevisionNode';
import SinkUriNode from './nodes/SinkUriNode';

const dragOperation: EditableDragOperationType = {
  type: CREATE_PUB_SUB_CONNECTOR_OPERATION,
  edit: true,
};

const dragOperationKafka: EditableDragOperationType = {
  type: CREATE_EV_SRC_KAFKA_CONNECTOR_OPERATION,
  edit: true,
};

export const getKnativeServingComponentFactory = (
  kind,
  type,
): React.ComponentType<{ element: GraphElement }> | undefined => {
  switch (type) {
    case TYPE_KNATIVE_SERVICE:
      return withCreateConnector(
        createConnectorCallback(),
        CreateConnector,
      )(
        withDndDrop<
          any,
          any,
          { droppable?: boolean; hover?: boolean; canDrop?: boolean; dropTarget?: boolean },
          NodeComponentProps
        >(eventSourceSinkDropTargetSpec)(
          withEditReviewAccess('update')(
            withSelection({ controlled: true })(
              withContextMenu(contextMenuActions)(KnativeService),
            ),
          ),
        ),
      );
    case TYPE_KNATIVE_REVISION:
      return withDragNode(nodeDragSourceSpec(type, false))(
        withSelection({ controlled: true })(
          withContextMenu(contextMenuActions)(withNoDrop()(RevisionNode)),
        ),
      );
    case TYPE_REVISION_TRAFFIC:
      return TrafficLink;
    default:
      return undefined;
  }
};

export const getKnativeEventingComponentFactory = (
  kind,
  type,
): React.ComponentType<{ element: GraphElement }> | undefined => {
  switch (type) {
    case TYPE_EVENT_SOURCE:
      return withEditReviewAccess('patch')(
        withDragNode(nodeDragSourceSpec(type))(
          withSelection({ controlled: true })(
            withContextMenu(contextMenuActions)(
              withDndDrop<any, any, {}, NodeComponentProps>(eventSourceTargetSpec)(EventSource),
            ),
          ),
        ),
      );
    case TYPE_EVENT_SINK:
      return withEditReviewAccess('patch')(
        withDragNode(nodeDragSourceSpec(type))(
          withSelection({ controlled: true })(withContextMenu(contextMenuActions)(EventSink)),
        ),
      );
    case TYPE_EVENT_PUB_SUB:
      return withCreateConnector(createConnectorCallback(), CreateConnector, '', {
        dragOperation,
      })(
        withEditReviewAccess('update')(
          withDragNode(nodeDragSourceSpec(type))(
            withSelection({ controlled: true })(
              withContextMenu(contextMenuActions)(
                withDndDrop<any, any, {}, NodeComponentProps>(pubSubDropTargetSpec)(
                  EventingPubSubNode,
                ),
              ),
            ),
          ),
        ),
      );
    case TYPE_SINK_URI:
      return withDragNode(nodeDragSourceSpec(type))(
        withSelection({ controlled: true })(
          withContextMenu(contextMenuActions)(
            withDndDrop<any, any, {}, NodeComponentProps>(sinkUriDropTargetSpec)(SinkUriNode),
          ),
        ),
      );
    case TYPE_EVENT_SOURCE_LINK:
      return withTargetDrag(eventSourceLinkDragSourceSpec())(EventSourceLink);
    case TYPE_EVENT_SINK_LINK:
      return EventSinkLink;
    case TYPE_EVENT_SOURCE_KAFKA:
      return withCreateConnector(kafkaSourceCreateConnectorCallback, CreateConnector, '', {
        dragOperation: dragOperationKafka,
      })(
        withEditReviewAccess('patch')(
          withDragNode(nodeDragSourceSpec(type))(
            withSelection({ controlled: true })(
              withContextMenu(contextMenuActions)(
                withDndDrop<any, any, {}, NodeComponentProps>(eventSourceTargetSpec)(EventSource),
              ),
            ),
          ),
        ),
      );
    case TYPE_KAFKA_CONNECTION_LINK:
      return withTargetDrag(eventSourceKafkaLinkDragSourceSpec())(BaseEdge);
    case TYPE_EVENT_PUB_SUB_LINK:
      return withContextMenu(contextMenuActions)(
        withTargetDrag(eventingPubSubLinkDragSourceSpec())(EventingPubSubLink),
      );
    default:
      return undefined;
  }
};

export const getKafkaSinkComponentFactory: ViewComponentFactory = (kind, type) => {
  if (type === TYPE_KAFKA_SINK) {
    return withEditReviewAccess('patch')(
      withDragNode(nodeDragSourceSpec(type))(
        withSelection({ controlled: true })(
          withContextMenu(contextMenuActions)(
            withDndDrop<any, any, {}, NodeComponentProps>(eventSourceSinkDropTargetSpec)(EventSink),
          ),
        ),
      ),
    );
  }
  return undefined;
};
