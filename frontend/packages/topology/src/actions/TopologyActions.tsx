import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { referenceFor } from '@console/internal/module/k8s';
import {
  ActionMenu,
  ActionMenuVariant,
  ActionServiceProvider,
  useDeepCompareMemoize,
} from '@console/shared';
import { getResource } from '../utils';

type TopologyActionsProps = {
  element: GraphElement;
};

const TopologyActions: React.FC<TopologyActionsProps> = ({ element }) => {
  const resource = getResource(element);
  const memoizedRes = useDeepCompareMemoize(resource);
  const context = React.useMemo(() => {
    const { csvName } = element.getData()?.data ?? {};
    return {
      'topology-actions': element,
      'topology-context-actions': { element },
      ...(memoizedRes ? { [referenceFor(memoizedRes)]: memoizedRes } : {}),
      ...(csvName ? { 'csv-actions': { csvName, memoizedRes } } : {}),
    };
  }, [element, memoizedRes]);
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

export default TopologyActions;
