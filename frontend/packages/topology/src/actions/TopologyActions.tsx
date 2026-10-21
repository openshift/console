import type { FC } from 'react';
import { useMemo } from 'react';
import type { GraphElement } from '@patternfly/react-topology';
import { observer } from '@patternfly/react-topology';
import { referenceFor } from '@console/internal/module/k8s';
import { ActionMenu, ActionMenuVariant, ActionServiceProvider } from '@console/shared';
import { getResource } from '../utils';

type TopologyActionsProps = {
  element: GraphElement;
};

const TopologyActions: FC<TopologyActionsProps> = ({ element }) => {
  const resource = getResource(element);
  const context = useMemo(() => {
    const { csvName } = element.getData()?.data ?? {};
    return {
      'topology-actions': element,
      'topology-context-actions': { element },
      ...(resource ? { [referenceFor(resource)]: resource } : {}),
      ...(csvName ? { 'operand-actions': { csvName, resource } } : {}),
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
