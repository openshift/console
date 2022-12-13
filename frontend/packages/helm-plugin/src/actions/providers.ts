import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { getResource } from '@console/topology/src/utils';
import { TYPE_HELM_RELEASE } from '../topology/components/const';
import { getHelmDeleteAction, getHelmRollbackAction, getHelmUpgradeAction } from './creators';
import { HelmActionsScope } from './types';

export const useHelmActionProvider = (scope: HelmActionsScope) => {
  const { t } = useTranslation();
  const result = React.useMemo(() => {
    if (!scope) return [[], true, undefined];
    return [
      [
        getHelmUpgradeAction(scope, t),
        ...(scope.release.version > 1 ? [getHelmRollbackAction(scope, t)] : []),
        getHelmDeleteAction(scope, t),
      ],
      true,
      undefined,
    ];
  }, [scope, t]);
  return result;
};

export const useHelmActionProviderForTopology = (element: GraphElement) => {
  const resource = getResource(element);
  const scope = React.useMemo(() => {
    const nodeType = element.getType();
    if (nodeType !== TYPE_HELM_RELEASE) return undefined;
    const releaseName = element.getLabel();
    if (!resource?.metadata) return null;
    const {
      namespace,
      labels: { version },
    } = resource.metadata;
    return {
      release: {
        name: releaseName,
        namespace,
        version: parseInt(version, 10),
      },
      actionOrigin: 'topology',
    };
  }, [element, resource]);
  const result = useHelmActionProvider(scope);
  return result;
};
