import * as React from 'react';
import {
  GraphElement,
  ComponentFactory,
  withDragNode,
  withSelection,
  withCreateConnector,
  withRemoveConnector,
} from '@patternfly/react-topology';
import {
  noRegroupWorkloadContextMenu,
  nodeDragSourceSpec,
  withContextMenu,
  withNoDrop,
  withEditReviewAccess,
  createConnectorCallback,
  CreateConnector,
  TYPE_SERVICE_BINDING,
  ServiceBinding,
} from '../../components';
import { removeServiceBindingCallback } from '../actions/serviceBindings';
import { TYPE_OPERATOR_BACKED_SERVICE, TYPE_OPERATOR_WORKLOAD } from './const';
import OperatorBackedService from './OperatorBackedService';
import { OperatorWorkloadNode } from './OperatorWorkloadNode';

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
        return withRemoveConnector(removeServiceBindingCallback)(ServiceBinding);
      default:
        return undefined;
    }
  };
};
