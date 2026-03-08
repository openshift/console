import { useMemo } from 'react';
import type { GraphElement, Node } from '@patternfly/react-topology';
import { isGraph } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { useCommonResourceActions } from '@console/app/src/actions//hooks/useCommonResourceActions';
import { getDisabledAddActions } from '@console/dev-console/src/utils/useAddActionExtensions';
import type { Action } from '@console/dynamic-plugin-sdk';
import type { SetFeatureFlag } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';
import { isCatalogTypeEnabled, useActiveNamespace } from '@console/shared';
import { getResource } from '@console/topology/src/utils';
import {
  FLAG_HELM_CHARTS_CATALOG_TYPE,
  HELM_CHART_ACTION_ID,
  HELM_CHART_CATALOG_TYPE_ID,
} from '../const';
import { TYPE_HELM_RELEASE } from '../topology/components/const';
import { HelmReleaseStatus } from '../types/helm-types';
import { AddHelmChartAction } from './add-resources';
import {
  useHelmDeleteAction,
  getHelmRollbackAction,
  getHelmUpgradeAction,
  editChartRepository,
} from './creators';
import type { HelmActionsScope } from './types';

export const useHelmActionProvider = (scope: HelmActionsScope) => {
  const { t } = useTranslation();
  const helmDeleteAction = useHelmDeleteAction(scope, t);
  const result = useMemo(() => {
    if (!scope) return [[], true, undefined];
    switch (scope?.release?.info?.status) {
      case HelmReleaseStatus.PendingInstall:
      case HelmReleaseStatus.PendingRollback:
      case HelmReleaseStatus.PendingUpgrade:
        return [[helmDeleteAction], true, undefined];
      default:
        return [
          [
            getHelmUpgradeAction(scope, t),
            ...(Number(scope.release.version) > 1 ? [getHelmRollbackAction(scope, t)] : []),
            helmDeleteAction,
          ],
          true,
          undefined,
        ];
    }
  }, [scope, t, helmDeleteAction]);
  return result;
};

export const useHelmActionProviderForTopology = (element: GraphElement) => {
  const resource = getResource(element);
  const data = element.getData();
  const scope = useMemo(() => {
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
        info: {
          status: data?.data?.status,
        },
      },
      actionOrigin: 'topology',
    };
  }, [data, element, resource]);
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
  const disabledAddActions = getDisabledAddActions();
  const isHelmDisabled = disabledAddActions?.includes(HELM_CHART_ACTION_ID);
  return useMemo(() => {
    if (isGraph(element) && !connectorSource && !isHelmDisabled) {
      return [[AddHelmChartAction(namespace, 'add-to-project', true)], true, undefined];
    }
    return [[], true, undefined];
  }, [connectorSource, element, namespace, isHelmDisabled]);
};

export const useHelmChartRepositoryActions = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const { t } = useTranslation();
  const commonActions = useCommonResourceActions(kindObj, resource);
  const actions = useMemo(() => {
    const index = commonActions.findIndex((action: Action) => action.id === 'edit-resource');
    if (index >= 0) {
      const modifiedActions = commonActions.filter(
        (action: Action) => action.id !== 'edit-resource',
      );
      modifiedActions.splice(index, 0, editChartRepository(kindObj, resource, t));
      return modifiedActions;
    }
    return commonActions;
  }, [kindObj, resource, commonActions, t]);

  return [actions, !inFlight, undefined];
};

export const helmChartTypeProvider = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag(FLAG_HELM_CHARTS_CATALOG_TYPE, isCatalogTypeEnabled(HELM_CHART_CATALOG_TYPE_ID));
};
