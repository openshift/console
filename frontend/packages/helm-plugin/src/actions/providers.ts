import * as React from 'react';
import { GraphElement, isGraph, Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { useActiveNamespace } from '@console/shared';
import { getResource } from '@console/topology/src/utils';
import { TYPE_HELM_RELEASE } from '../topology/components/const';
import { AddHelmChartAction } from './add-resources';
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
  const scope = React.useMemo(() => {
    const nodeType = element.getType();
    if (nodeType !== TYPE_HELM_RELEASE) return undefined;
    const releaseName = element.getLabel();
    const {
      namespace,
      labels: { version },
    } = getResource(element).metadata;
    return {
      release: {
        name: releaseName,
        namespace,
        version: parseInt(version, 10),
      },
      actionOrigin: 'topology',
    };
  }, [element]);
  const result = useHelmActionProvider(scope);
  return result;
};

export const useTopologyActionProvider = ({
  element,
  connectorSource,
}: {
  element: GraphElement;
  connectorSource?: Node;
}) => {
  const [namespace] = useActiveNamespace();

  return React.useMemo(() => {
    if (isGraph(element) && !connectorSource) {
      return [[AddHelmChartAction(namespace, 'add-to-project', true)], true, undefined];
    }
    return [[], true, undefined];
  }, [connectorSource, element, namespace]);
};
