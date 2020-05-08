import * as React from 'react';
import {
  GraphElement,
  Node,
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
  createMenuItems,
  TopologyDataObject,
  getTopologyResourceObject,
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
import { KebabOption, kebabOptionsToMenu } from '@console/internal/components/utils';
import { RevisionModel } from '../../models';
import { getRevisionActions } from '../../actions/getRevisionActions';

const revisionActions = (node: TopologyDataObject): KebabOption[] => {
  const contextMenuResource = getTopologyResourceObject(node);
  if (!contextMenuResource) {
    return null;
  }

  const menuActions = getRevisionActions();
  return menuActions.map((a) => a(RevisionModel, contextMenuResource));
};

const revisionContextMenu = (element: Node) =>
  createMenuItems(kebabOptionsToMenu(revisionActions(element.getData())));

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
            )(withContextMenu(revisionContextMenu)(withNoDrop()(RevisionNode))),
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
