import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { ActionsLoader, ActionMenu, ActionMenuVariant } from '@console/shared';

type TopologyActionsProps = {
  element: GraphElement;
};

const TopologyActions: React.FC<TopologyActionsProps> = ({ element }) => {
  return (
    <ActionsLoader contextId="topology-actions" scope={element}>
      {({ actions, loaded }) =>
        loaded && <ActionMenu actions={actions} variant={ActionMenuVariant.DROPDOWN} />
      }
    </ActionsLoader>
  );
};

export default TopologyActions;
