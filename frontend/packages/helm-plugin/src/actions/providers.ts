import * as React from 'react';
import { GraphElement, Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { getResource } from '@console/topology/src/utils';
import { TYPE_HELM_RELEASE } from '../topology/components/const';
import { getHelmDeleteAction, getHelmRollbackAction, getHelmUpgradeAction } from './creators';
import { HelmActionsScope } from './types';

export const useHelmActionProvider = (scope: HelmActionsScope) => {
  const { t } = useTranslation();
  const actions = React.useMemo(
    () => [
      getHelmUpgradeAction(scope, t),
      ...(scope.release.version > 1 ? [getHelmRollbackAction(scope, t)] : []),
      getHelmDeleteAction(scope, t),
    ],
    [scope, t],
  );

  return [actions, true, undefined];
};

export const useHelmActionProviderForTopology = (element: GraphElement) => {
  const nodeType = element.getType();
  const scope = React.useMemo(() => {
    const releaseName = element.getLabel();
    const {
      namespace,
      labels: { version },
    } = getResource(element as Node).metadata;

    return {
      release: {
        name: releaseName,
        namespace,
        version: parseInt(version, 10),
      },
      actionOrigin: 'topology',
    };
  }, [element]);
  const actions = useHelmActionProvider(scope);
  if (nodeType !== TYPE_HELM_RELEASE) return [[], true, undefined];
  return actions;
};
