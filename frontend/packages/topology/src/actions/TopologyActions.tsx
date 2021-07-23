import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { ActionMenu, ActionMenuVariant, ActionServiceProvider } from '@console/shared';

type TopologyActionsProps = {
  element: GraphElement;
};

const TopologyActions: React.FC<TopologyActionsProps> = ({ element }) => {
  return (
    <ActionServiceProvider context={{ 'topology-actions': element }}>
      {({ actions, options, loaded }) =>
        loaded && (
          <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
        )
      }
    </ActionServiceProvider>
  );
};

export default TopologyActions;
