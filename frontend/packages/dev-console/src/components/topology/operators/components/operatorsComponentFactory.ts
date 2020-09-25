import * as React from 'react';
import {
  GraphElement,
  ComponentFactory,
  withDragNode,
  withSelection,
  withCreateConnector,
} from '@patternfly/react-topology';
import { Kebab, kebabOptionsToMenu } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import {
  noRegroupWorkloadContextMenu,
  nodeDragSourceSpec,
  withContextMenu,
  withNoDrop,
  withEditReviewAccess,
  createConnectorCallback,
  CreateConnector,
  createMenuItems,
  TYPE_SERVICE_BINDING,
  ServiceBinding,
} from '../../components';
import { TYPE_OPERATOR_BACKED_SERVICE, TYPE_OPERATOR_WORKLOAD } from './const';
import OperatorBackedService from './OperatorBackedService';
import { OperatorWorkloadNode } from './OperatorWorkloadNode';
import { OdcBaseEdge } from '../../elements';

const serviceBindingActions = (edge: OdcBaseEdge) => {
  const sbr = edge.getResource();
  const { common } = Kebab.factory;
  const menuActions = [
    ...Kebab.getExtensionsActionsForKind(modelFor(referenceFor(sbr))),
    ...common,
  ];
  const actions = menuActions.map((a) => a(modelFor(referenceFor(sbr)), sbr));
  return createMenuItems(kebabOptionsToMenu(actions));
};

export const getOperatorsComponentFactory = (): ComponentFactory => {
  return (kind, type): React.ComponentType<{ element: GraphElement }> | undefined => {
    switch (type) {
      case TYPE_OPERATOR_BACKED_SERVICE:
        return withSelection({ controlled: true })(withNoDrop()(OperatorBackedService));
      case TYPE_OPERATOR_WORKLOAD:
        return withCreateConnector(
          createConnectorCallback(),
          CreateConnector,
        )(
          withEditReviewAccess('patch')(
            withDragNode(nodeDragSourceSpec(type, false))(
              withSelection({ controlled: true })(
                withContextMenu(noRegroupWorkloadContextMenu)(OperatorWorkloadNode),
              ),
            ),
          ),
        );
      case TYPE_SERVICE_BINDING:
        return withContextMenu(serviceBindingActions)(ServiceBinding);
      default:
        return undefined;
    }
  };
};
