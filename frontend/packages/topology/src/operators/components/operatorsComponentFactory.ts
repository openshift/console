import * as React from 'react';
import { GraphElement, withSelection } from '@patternfly/react-topology';
import { Kebab, kebabOptionsToMenu } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import {
  withContextMenu,
  withNoDrop,
  createMenuItems,
  ServiceBinding,
} from '../../components/graph-view/components';
import { TYPE_SERVICE_BINDING } from '../../const';
import { OdcBaseEdge } from '../../elements';
import { TYPE_OPERATOR_BACKED_SERVICE } from './const';
import OperatorBackedService from './OperatorBackedService';

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

export const getOperatorsComponentFactory = (
  kind,
  type,
): React.ComponentType<{ element: GraphElement }> | undefined => {
  switch (type) {
    case TYPE_OPERATOR_BACKED_SERVICE:
      return withSelection({ controlled: true })(withNoDrop()(OperatorBackedService));
    case TYPE_SERVICE_BINDING:
      return withContextMenu(serviceBindingActions)(ServiceBinding);
    default:
      return undefined;
  }
};
