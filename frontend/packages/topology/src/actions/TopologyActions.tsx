import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { ActionsMenu } from '@console/internal/components/utils';
import { ActionsLoader } from '@console/shared';

type TopologyActionsProps = {
  element: GraphElement;
};

const TopologyActions: React.FC<TopologyActionsProps> = ({ element }) => {
  return (
    <ActionsLoader contextId="topology-actions" scope={element}>
      {(actions, loaded) => loaded && <ActionsMenu actions={actions} />}
    </ActionsLoader>
  );
};

export default TopologyActions;
