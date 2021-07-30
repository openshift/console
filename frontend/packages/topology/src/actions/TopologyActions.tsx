import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { referenceFor } from '@console/internal/module/k8s';
import { ActionMenu, ActionMenuVariant, ActionServiceProvider } from '@console/shared';
import { getResource } from '../utils';

type TopologyActionsProps = {
  element: GraphElement;
};

const TopologyActions: React.FC<TopologyActionsProps> = ({ element }) => {
  const context = React.useMemo(() => {
    const resource = getResource(element);
    return {
      'topology-actions': element,
      [referenceFor(resource)]: resource,
    };
  }, [element]);
  return (
    <ActionServiceProvider context={context}>
      {({ actions, options, loaded }) => {
        return (
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        );
      }}
    </ActionServiceProvider>
  );
};

export default TopologyActions;
