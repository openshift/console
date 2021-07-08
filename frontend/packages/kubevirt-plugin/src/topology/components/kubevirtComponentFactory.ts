import * as React from 'react';
import {
  GraphElement,
  Node,
  withCreateConnector,
  withDndDrop,
  withDragNode,
  withSelection,
} from '@patternfly/react-topology';
import { KebabOption, kebabOptionsToMenu } from '@console/internal/components/utils';
import { K8sResourceKind, modelFor, referenceFor } from '@console/internal/module/k8s';
import { ModifyApplication } from '@console/topology/src/actions';
import {
  CreateConnector,
  createConnectorCallback,
  createMenuItems,
  NodeComponentProps,
  nodeDragSourceSpec,
  nodeDropTargetSpec,
  withContextMenu,
} from '@console/topology/src/components/graph-view';
import { TopologyDataObject } from '@console/topology/src/topology-types';
import { getResource, withEditReviewAccess } from '@console/topology/src/utils';
import { vmMenuActions } from '../../components/vms/menu-actions';
import { VMNodeData } from '../types';
import { TYPE_VIRTUAL_MACHINE } from './const';
import { VmNode } from './nodes/VmNode';

export const vmActions = (
  contextMenuResource: K8sResourceKind,
  vm: TopologyDataObject<VMNodeData>,
): KebabOption[] => {
  if (!contextMenuResource) {
    return null;
  }
  const {
    data: { vmi, vmStatusBundle },
  } = vm;

  const model = modelFor(referenceFor(contextMenuResource));
  return [
    ModifyApplication(model, contextMenuResource),
    ...vmMenuActions.map((action) => {
      return action(model, contextMenuResource, {
        vmi,
        vmStatusBundle,
      });
    }),
  ];
};

export const vmContextMenu = (element: Node) => {
  return createMenuItems(kebabOptionsToMenu(vmActions(getResource(element), element.getData())));
};

export const getKubevirtComponentFactory = (
  kind,
  type,
): React.ComponentType<{ element: GraphElement }> | undefined => {
  switch (type) {
    case TYPE_VIRTUAL_MACHINE:
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
            withDragNode(nodeDragSourceSpec(type))(
              withSelection({ controlled: true })(withContextMenu(vmContextMenu)(VmNode)),
            ),
          ),
        ),
      );
    default:
      return undefined;
  }
};
