import * as React from 'react';
import {
  Node,
  GraphElement,
  ComponentFactory,
  withDragNode,
  withSelection,
  withDndDrop,
  withCreateConnector,
} from '@patternfly/react-topology';
import { kebabOptionsToMenu } from '@console/internal/components/utils';
import { WorkloadNode } from '../../components/nodes';
import { noRegroupWorkloadContextMenu, createMenuItems } from '../../components/nodeContextMenu';
import {
  createConnectorCallback,
  NodeComponentProps,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  withContextMenu,
  withNoDrop,
} from '../../components/componentUtils';
import { withEditReviewAccess } from '../../components/withEditReviewAccess';
import { CreateConnector } from '../../components/edges';
import { helmReleaseActions } from '../actions/helmReleaseActions';
import { TYPE_HELM_RELEASE, TYPE_HELM_WORKLOAD } from './const';
import HelmRelease from './HelmRelease';

export const helmReleaseContextMenu = (element: Node) =>
  createMenuItems(kebabOptionsToMenu(helmReleaseActions(element)));

export const getHelmComponentFactory = (): ComponentFactory => {
  return (kind, type): React.ComponentType<{ element: GraphElement }> | undefined => {
    switch (type) {
      case TYPE_HELM_RELEASE:
        return withSelection({ controlled: true })(
          withContextMenu(helmReleaseContextMenu)(withNoDrop()(HelmRelease)),
        );
      case TYPE_HELM_WORKLOAD:
        return withCreateConnector(
          createConnectorCallback(),
          CreateConnector,
        )(
          withDndDrop<
            any,
            any,
            { droppable?: boolean; hover?: boolean; canDrop?: boolean },
            NodeComponentProps
          >(nodeDropTargetSpec)(
            withEditReviewAccess('patch')(
              withDragNode(nodeDragSourceSpec(type, false))(
                withSelection({ controlled: true })(
                  withContextMenu(noRegroupWorkloadContextMenu)(WorkloadNode),
                ),
              ),
            ),
          ),
        );
      default:
        return undefined;
    }
  };
};
