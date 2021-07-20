import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { ActionsLoader } from '@console/shared';
import { createContextMenuItems } from '../components/graph-view';

export const contextMenuActions = (element: Node): React.ReactElement[] => {
  return [
    <ActionsLoader key="topology" contextId="topology-actions" scope={element}>
      {(loader) => loader.loaded && createContextMenuItems(loader.options)}
    </ActionsLoader>,
  ];
};
