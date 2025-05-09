import * as React from 'react';
import {
  GraphElement,
  WithContextMenuProps,
  withDragNode,
  withSelection,
} from '@patternfly/react-topology';
import { contextMenuActions } from '../../actions';
import {
  withContextMenu,
  withNoDrop,
  noRegroupDragSourceSpec,
} from '../../components/graph-view/components';
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
          withNoDrop()(withDragNode(noRegroupDragSourceSpec)(OperatorBackedService)) as React.FC<
            WithContextMenuProps
          >,
        ),
      );
    default:
      return undefined;
  }
};
