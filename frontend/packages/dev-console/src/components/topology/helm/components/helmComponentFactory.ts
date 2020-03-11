import * as React from 'react';
import {
  GraphElement,
  ComponentFactory as TopologyComponentFactory,
  withDragNode,
  withSelection,
  withDndDrop,
} from '@console/topology';
import { WorkloadNode } from '../../components/nodes';
import { workloadContextMenu, helmReleaseContextMenu } from '../../components/nodeContextMenu';
import {
  NodeComponentProps,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  withContextMenu,
  withNoDrop,
} from '../../components/componentUtils';
import { TYPE_HELM_RELEASE, TYPE_HELM_WORKLOAD } from './const';
import { withEditReviewAccess } from '../../components/withEditReviewAccess';
import HelmRelease from './HelmRelease';
import { AbstractSBRComponentFactory } from '../../components/AbstractSBRComponentFactory';

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
                  withSelection(false, true)(withContextMenu(workloadContextMenu)(WorkloadNode)),
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
