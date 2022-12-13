import * as React from 'react';
import { observer, GraphElement } from '@patternfly/react-topology';
import { referenceFor } from '@console/internal/module/k8s';
import { ActionMenu, ActionMenuVariant, ActionServiceProvider } from '@console/shared';
import { getResource } from '../utils';

type TopologyActionsProps = {
  element: GraphElement;
};

const TopologyActions: React.FC<TopologyActionsProps> = ({ element }) => {
  const resource = getResource(element);
  const context = React.useMemo(() => {
    return {
      'topology-actions': element,
      [referenceFor(resource)]: resource,
    };
  }, [element, resource]);
  return (
    <ActionServiceProvider key={element.getId()} context={context}>
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

export default observer(TopologyActions);
