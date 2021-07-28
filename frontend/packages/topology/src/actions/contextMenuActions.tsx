import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { ActionServiceProvider } from '@console/shared';
import { createContextMenuItems } from '../components/graph-view';

export const contextMenuActions = (element: Node): React.ReactElement[] => {
  return [
    <ActionServiceProvider key="topology" context={{ 'topology-actions': element }}>
      {({ options, loaded }) => loaded && createContextMenuItems(options)}
    </ActionServiceProvider>,
  ];
};
