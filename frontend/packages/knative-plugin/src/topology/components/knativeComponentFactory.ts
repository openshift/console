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
} from '@console/topology';
import {
  NodeComponentProps,
  withContextMenu,
  withNoDrop,
  nodeDragSourceSpec,
  withEditReviewAccess,
  createMenuItems,
  getTopologyResourceObject,
  createConnectorCallback,
  CreateConnector,
} from '@console/dev-console/src/components/topology';
import { ModifyApplication } from '@console/dev-console/src/actions/modify-application';
import { Kebab, kebabOptionsToMenu } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { RevisionModel } from '../../models';
import { getRevisionActions } from '../../actions/getRevisionActions';
import {
  TYPE_EVENT_SOURCE,
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KNATIVE_REVISION,
  TYPE_KNATIVE_SERVICE,
  TYPE_REVISION_TRAFFIC,
  TYPE_EVENT_PUB_SUB,
  TYPE_EVENT_PUB_SUB_LINK,
} from '../const';
import KnativeService from './groups/KnativeService';
import RevisionNode from './nodes/RevisionNode';
import TrafficLink from './edges/TrafficLink';
import EventSourceLink from './edges/EventSourceLink';
import EventingPubSubLink from './edges/EventingPubSubLink';
import EventSource from './nodes/EventSource';
import EventingPubSubNode from './nodes/EventingPubSubNode';
import {
  eventSourceLinkDragSourceSpec,
  eventingPubSubLinkDragSourceSpec,
  eventSourceTargetSpec,
  eventSourceSinkDropTargetSpec,
  pubSubDropTargetSpec,
} from './knativeComponentUtils';

export const knativeContextMenu = (element: Node) => {
  const item = getTopologyResourceObject(element.getData());
  const model = modelFor(referenceFor(item));

  const actions = [];
  if (model.kind === RevisionModel.kind) {
    actions.push(...getRevisionActions());
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
              withSelection(false, true)(withContextMenu(knativeContextMenu)(KnativeService)),
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
              withContextMenu(knativeContextMenu)(
                withDndDrop<any, any, {}, NodeComponentProps>(eventSourceTargetSpec)(EventSource),
              ),
            ),
          ),
        );
      case TYPE_EVENT_PUB_SUB:
        return withEditReviewAccess('update')(
          withDragNode(nodeDragSourceSpec(type))(
            withSelection(
              false,
              true,
            )(
              withContextMenu(knativeContextMenu)(
                withDndDrop<any, any, {}, NodeComponentProps>(pubSubDropTargetSpec)(
                  EventingPubSubNode,
                ),
              ),
            ),
          ),
        );
      case TYPE_KNATIVE_REVISION:
        return withDragNode(nodeDragSourceSpec(type, false))(
          withSelection(
            false,
            true,
          )(withContextMenu(knativeContextMenu)(withNoDrop()(RevisionNode))),
        );
      case TYPE_REVISION_TRAFFIC:
        return TrafficLink;
      case TYPE_EVENT_SOURCE_LINK:
        return withTargetDrag(eventSourceLinkDragSourceSpec())(EventSourceLink);
      case TYPE_EVENT_PUB_SUB_LINK:
        return withTargetDrag(eventingPubSubLinkDragSourceSpec())(EventingPubSubLink);
      default:
        return undefined;
    }
  };
};
