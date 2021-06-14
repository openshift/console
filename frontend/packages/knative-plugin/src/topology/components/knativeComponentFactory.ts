import * as React from 'react';
import {
  GraphElement,
  Node,
  ComponentFactory,
  withDragNode,
  withTargetDrag,
  withSelection,
  withDndDrop,
  withCreateConnector,
} from '@patternfly/react-topology';
import { Kebab, kebabOptionsToMenu } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { ModifyApplication } from '@console/topology/src/actions';
import {
  NodeComponentProps,
  withContextMenu,
  withNoDrop,
  nodeDragSourceSpec,
  createMenuItems,
  createConnectorCallback,
  CreateConnector,
  EditableDragOperationType,
} from '@console/topology/src/components/graph-view';
import { withEditReviewAccess, getResource } from '@console/topology/src/utils';
import { editSinkUri } from '../../actions/edit-sink-uri';
import { getRevisionActions } from '../../actions/getRevisionActions';
import { RevisionModel } from '../../models';
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
} from '../const';
import EventingPubSubLink from './edges/EventingPubSubLink';
import EventSourceLink from './edges/EventSourceLink';
import KafkaConnectionLink from './edges/KafkaConnectionLink';
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
} from './knativeComponentUtils';
import EventingPubSubNode from './nodes/EventingPubSubNode';
import EventSource from './nodes/EventSource';
import RevisionNode from './nodes/RevisionNode';
import SinkUriNode from './nodes/SinkUriNode';

export const knativeContextMenu = (element: Node) => {
  const item = getResource(element);
  const model = modelFor(referenceFor(item));

  const actions = [];
  if (model.kind === RevisionModel.kind) {
    actions.push(...getRevisionActions());
  } else if (element.getType() === TYPE_EVENT_PUB_SUB_LINK) {
    actions.push(...Kebab.getExtensionsActionsForKind(model), ...Kebab.factory.common);
  } else {
    actions.push(
      ModifyApplication,
      ...Kebab.getExtensionsActionsForKind(model),
      ...Kebab.factory.common,
    );
  }

  const kebabOptions = actions.map((action) => {
    return action(model, item);
  });

  return createMenuItems(kebabOptionsToMenu(kebabOptions));
};

export const editUriContextMenu = (element: Node) => {
  const item = element.getData();
  const actions = [];
  const { obj, eventSources } = item.resources;
  if (eventSources.length > 0) {
    const sourceModel = modelFor(referenceFor(eventSources[0]));
    actions.push(editSinkUri(sourceModel, obj, eventSources));
  }
  return createMenuItems(kebabOptionsToMenu(actions));
};

const dragOperation: EditableDragOperationType = {
  type: CREATE_PUB_SUB_CONNECTOR_OPERATION,
  edit: true,
};

const dragOperationKafka: EditableDragOperationType = {
  type: CREATE_EV_SRC_KAFKA_CONNECTOR_OPERATION,
  edit: true,
};

export const getKnativeComponentFactory = (): ComponentFactory => {
  return (kind, type): React.ComponentType<{ element: GraphElement }> | undefined => {
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
                withContextMenu(knativeContextMenu)(KnativeService),
              ),
            ),
          ),
        );
      case TYPE_EVENT_SOURCE:
        return withEditReviewAccess('patch')(
          withDragNode(nodeDragSourceSpec(type))(
            withSelection({ controlled: true })(
              withContextMenu(knativeContextMenu)(
                withDndDrop<any, any, {}, NodeComponentProps>(eventSourceTargetSpec)(EventSource),
              ),
            ),
          ),
        );
      case TYPE_EVENT_PUB_SUB:
        return withCreateConnector(createConnectorCallback(), CreateConnector, '', {
          dragOperation,
        })(
          withEditReviewAccess('update')(
            withDragNode(nodeDragSourceSpec(type))(
              withSelection({ controlled: true })(
                withContextMenu(knativeContextMenu)(
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
            withContextMenu(editUriContextMenu)(
              withDndDrop<any, any, {}, NodeComponentProps>(sinkUriDropTargetSpec)(SinkUriNode),
            ),
          ),
        );
      case TYPE_KNATIVE_REVISION:
        return withDragNode(nodeDragSourceSpec(type, false))(
          withSelection({ controlled: true })(
            withContextMenu(knativeContextMenu)(withNoDrop()(RevisionNode)),
          ),
        );
      case TYPE_REVISION_TRAFFIC:
        return TrafficLink;
      case TYPE_EVENT_SOURCE_LINK:
        return withTargetDrag(eventSourceLinkDragSourceSpec())(EventSourceLink);
      case TYPE_EVENT_SOURCE_KAFKA:
        return withCreateConnector(createConnectorCallback(), CreateConnector, '', {
          dragOperation: dragOperationKafka,
        })(
          withEditReviewAccess('patch')(
            withDragNode(nodeDragSourceSpec(type))(
              withSelection({ controlled: true })(
                withContextMenu(knativeContextMenu)(
                  withDndDrop<any, any, {}, NodeComponentProps>(eventSourceTargetSpec)(EventSource),
                ),
              ),
            ),
          ),
        );
      case TYPE_KAFKA_CONNECTION_LINK:
        return withTargetDrag(eventSourceKafkaLinkDragSourceSpec())(KafkaConnectionLink);
      case TYPE_EVENT_PUB_SUB_LINK:
        return withContextMenu(knativeContextMenu)(
          withTargetDrag(eventingPubSubLinkDragSourceSpec())(EventingPubSubLink),
        );
      default:
        return undefined;
    }
  };
};
