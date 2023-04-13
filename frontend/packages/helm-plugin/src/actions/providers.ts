import * as React from 'react';
import { GraphElement, isGraph, Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { getCommonResourceActions } from '@console/app/src/actions/creators/common-factory';
import { getDisabledAddActions } from '@console/dev-console/src/utils/useAddActionExtensions';
import { Action } from '@console/dynamic-plugin-sdk';
import { SetFeatureFlag, useK8sModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { isCatalogTypeEnabled, useActiveNamespace } from '@console/shared';
import { getResource } from '@console/topology/src/utils';
import {
  FLAG_HELM_CHARTS_CATALOG_TYPE,
  HELM_CHART_ACTION_ID,
  HELM_CHART_CATALOG_TYPE_ID,
} from '../const';
import { TYPE_HELM_RELEASE } from '../topology/components/const';
import { AddHelmChartAction } from './add-resources';
import {
  getHelmDeleteAction,
  getHelmRollbackAction,
  getHelmUpgradeAction,
  editChartRepository,
} from './creators';
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
  return React.useMemo(() => {
    if (isGraph(element) && !connectorSource && !isHelmDisabled) {
      return [[AddHelmChartAction(namespace, 'add-to-project', true)], true, undefined];
    }
    return [[], true, undefined];
  }, [connectorSource, element, namespace, isHelmDisabled]);
};

export const useHelmChartRepositoryActions = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const { t } = useTranslation();
  const actions = React.useMemo(() => {
    let commonActions = getCommonResourceActions(kindObj, resource);
    const index = commonActions.findIndex((action: Action) => action.id === 'edit-resource');
    if (index >= 0) {
      commonActions = commonActions.filter((action: Action) => action.id !== 'edit-resource');
      commonActions.splice(index, 0, editChartRepository(kindObj, resource, t));
    }
    return commonActions;
  }, [kindObj, resource, t]);

  return [actions, !inFlight, undefined];
};

export const helmChartTypeProvider = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag(FLAG_HELM_CHARTS_CATALOG_TYPE, isCatalogTypeEnabled(HELM_CHART_CATALOG_TYPE_ID));
};
