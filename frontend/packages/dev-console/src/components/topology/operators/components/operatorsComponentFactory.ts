import * as React from 'react';
import {
  GraphElement,
  ComponentFactory as TopologyComponentFactory,
  withDragNode,
  withSelection,
  withDndDrop,
} from '@console/topology';
import { WorkloadNode } from '../../components/nodes';
import {
  workloadContextMenu,
  regroupGroupContextMenu,
  NodeComponentProps,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  withContextMenu,
  withNoDrop,
  withEditReviewAccess,
  AbstractSBRComponentFactory,
} from '../../components';
import {
  TYPE_OPERATOR_BACKED_SERVICE,
  TYPE_OPERATOR_WORKLOAD,
} from './const';
import OperatorBackedService from './OperatorBackedService';

class OperatorsComponentFactory extends AbstractSBRComponentFactory {
  getFactory = (): TopologyComponentFactory => {
    return (kind, type): React.ComponentType<{ element: GraphElement }> | undefined => {
      switch (type) {
        case TYPE_OPERATOR_BACKED_SERVICE:
          return withSelection(
            false,
            true,
          )(withContextMenu(regroupGroupContextMenu)(withNoDrop()(OperatorBackedService)));
        case TYPE_OPERATOR_WORKLOAD:
          return this.withAddResourceConnector()(
            withEditReviewAccess('patch')(
              withDndDrop<
                any,
                any,
                { droppable?: boolean; hover?: boolean; canDrop?: boolean },
                NodeComponentProps
              >(nodeDropTargetSpec)(
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

export { OperatorsComponentFactory };
