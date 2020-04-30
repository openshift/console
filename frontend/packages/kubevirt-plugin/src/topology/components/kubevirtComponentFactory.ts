import * as React from 'react';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { KebabOption, kebabOptionsToMenu } from '@console/internal/components/utils';
import {
  GraphElement,
  ComponentFactory as TopologyComponentFactory,
  withDragNode,
  withDndDrop,
  withSelection,
  Node,
} from '@console/topology';
import {
  NodeComponentProps,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  withEditReviewAccess,
  withContextMenu,
  AbstractSBRComponentFactory,
  createMenuItems,
  TopologyDataObject,
  getTopologyResourceObject,
} from '@console/dev-console/src/components/topology';
import { vmMenuActions } from '../../components/vms/menu-actions';
import { VmNode } from './nodes/VmNode';
import { TYPE_VIRTUAL_MACHINE } from './const';

export const vmActions = (vm: TopologyDataObject): KebabOption[] => {
  const contextMenuResource = getTopologyResourceObject(vm);
  if (!contextMenuResource) {
    return null;
  }
  const data = vm.data as any;

  const model = modelFor(referenceFor(contextMenuResource));

  return vmMenuActions.map((action) => {
    return action(model, contextMenuResource, { vmi: data.vmi, vmStatusBundle: data.statusDetail });
  });
};

export const vmContextMenu = (element: Node) => {
  return createMenuItems(kebabOptionsToMenu(vmActions(element.getData())));
};

class KubevirtComponentFactory extends AbstractSBRComponentFactory {
  getFactory = (): TopologyComponentFactory => {
    return (kind, type): React.ComponentType<{ element: GraphElement }> | undefined => {
      switch (type) {
        case TYPE_VIRTUAL_MACHINE:
          return this.withAddResourceConnector()(
            withDndDrop<
              any,
              any,
              { droppable?: boolean; hover?: boolean; canDrop?: boolean },
              NodeComponentProps
            >(nodeDropTargetSpec)(
              withEditReviewAccess('patch')(
                withDragNode(nodeDragSourceSpec(type))(
                  withSelection(false, true)(withContextMenu(vmContextMenu)(VmNode)),
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

export { KubevirtComponentFactory };
