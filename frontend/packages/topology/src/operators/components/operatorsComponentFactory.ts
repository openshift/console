import * as React from 'react';
import { GraphElement, withDragNode, withSelection } from '@patternfly/react-topology';
import { contextMenuActions } from '../../actions';
import {
  withContextMenu,
  withNoDrop,
  ServiceBinding,
  noRegroupDragSourceSpec,
} from '../../components/graph-view/components';
import { TYPE_SERVICE_BINDING } from '../../const';
import { TYPE_OPERATOR_BACKED_SERVICE } from './const';
import OperatorBackedService from './OperatorBackedService';

export const getOperatorsComponentFactory = (
  kind,
  type,
): React.ComponentType<{ element: GraphElement }> | undefined => {
  switch (type) {
    case TYPE_OPERATOR_BACKED_SERVICE:
      return withSelection({ controlled: true })(
        withContextMenu(contextMenuActions)(
          withNoDrop()(withDragNode(noRegroupDragSourceSpec)(OperatorBackedService)),
        ),
      );
    case TYPE_SERVICE_BINDING:
      return withContextMenu(contextMenuActions)(ServiceBinding);
    default:
      return undefined;
  }
};
