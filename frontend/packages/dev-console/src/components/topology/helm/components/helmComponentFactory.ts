import * as React from 'react';
import {
  Node,
  GraphElement,
  ComponentFactory as TopologyComponentFactory,
  withDragNode,
  withSelection,
  withDndDrop,
} from '@console/topology';
import { kebabOptionsToMenu } from '@console/internal/components/utils';
import { WorkloadNode } from '../../components/nodes';
import { noRegroupWorkloadContextMenu, createMenuItems } from '../../components/nodeContextMenu';
import {
  NodeComponentProps,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  withContextMenu,
  withNoDrop,
} from '../../components/componentUtils';
import { withEditReviewAccess } from '../../components/withEditReviewAccess';
import { AbstractSBRComponentFactory } from '../../components/AbstractSBRComponentFactory';
import { helmReleaseActions } from '../actions/helmReleaseActions';
import { TYPE_HELM_RELEASE, TYPE_HELM_WORKLOAD } from './const';
import HelmRelease from './HelmRelease';

export const helmReleaseContextMenu = (element: Node) =>
  createMenuItems(kebabOptionsToMenu(helmReleaseActions(element)));

class HelmComponentFactory extends AbstractSBRComponentFactory {
  getFactory = (): TopologyComponentFactory => {
    return (kind, type): React.ComponentType<{ element: GraphElement }> | undefined => {
      switch (type) {
        case TYPE_HELM_RELEASE:
          return withSelection(
            false,
            true,
          )(withContextMenu(helmReleaseContextMenu)(withNoDrop()(HelmRelease)));
        case TYPE_HELM_WORKLOAD:
          return this.withAddResourceConnector()(
            withDndDrop<
              any,
              any,
              { droppable?: boolean; hover?: boolean; canDrop?: boolean },
              NodeComponentProps
            >(nodeDropTargetSpec)(
              withEditReviewAccess('patch')(
                withDragNode(nodeDragSourceSpec(type, false))(
                  withSelection(
                    false,
                    true,
                  )(withContextMenu(noRegroupWorkloadContextMenu)(WorkloadNode)),
                ),
              ),
            ),
          );
        default:
          return undefined;
      }
    };
  };
}

export { HelmComponentFactory };
