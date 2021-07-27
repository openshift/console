import * as React from 'react';
import { GraphElement, Node } from '@patternfly/react-topology';
import { referenceFor } from '@console/internal/module/k8s';
import { ActionMenu, ActionMenuVariant, ActionServiceProvider } from '@console/shared';
import { getResource } from '../utils';

type TopologyActionsProps = {
  element: GraphElement;
};

const TopologyActions: React.FC<TopologyActionsProps> = ({ element }) => {
  const resource = getResource(element as Node);
  return (
    <ActionServiceProvider
      context={{ 'topology-actions': element, [referenceFor(resource)]: resource }}
    >
      {({ actions, options, loaded }) =>
        loaded && (
          <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
        )
      }
    </ActionServiceProvider>
  );
};

export default TopologyActions;
