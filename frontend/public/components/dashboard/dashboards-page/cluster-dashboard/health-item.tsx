import type { ComponentType, FC } from 'react';
import { useEffect, useContext, useMemo } from 'react';
import { Map as ImmutableMap } from 'immutable';
import { useTranslation } from 'react-i18next';
import { Stack, StackItem } from '@patternfly/react-core';
import {
  ResolvedExtension,
  DashboardsOverviewHealthOperator,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewHealthResourceSubsystem,
  OperatorRowProps,
  WatchK8sResources,
  WatchK8sResults,
  ResourcesObject,
  SubsystemHealth,
} from '@console/dynamic-plugin-sdk';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { OperatorsSection } from '@console/shared/src/components/dashboard/status-card/OperatorStatusBody';
import {
  getOperatorsHealthState,
  getMostImportantStatuses,
} from '@console/shared/src/components/dashboard/status-card/state-utils';
import {
  HealthState,
  healthStateMessage,
} from '@console/shared/src/components/dashboard/status-card/states';
import { useDynamicK8sWatchResources } from '@console/shared/src/hooks/useDynamicK8sWatchResources';
import { useDashboardResources } from '@console/shared/src/hooks/useDashboardResources';
import { K8sKind } from '../../../../module/k8s';
import { FirehoseResourcesResult } from '../../../utils/types';
import { AsyncComponent, LazyLoader } from '../../../utils/async';
import { resourcePath } from '../../../utils/resource-link';
import { useK8sWatchResource, useK8sWatchResources } from '../../../utils/k8s-watch-hook';
import { uniqueResource } from './utils';
import { getPrometheusQueryResponse } from '../../../../actions/dashboards';
import { ClusterDashboardContext } from './context';

const OperatorRow: FC<
  OperatorRowProps & {
    LoadingComponent: () => JSX.Element;
    Component: ComponentType<OperatorRowProps> | LazyLoader<ComponentType<OperatorRowProps>>;
    key: string;
    isResolved: boolean;
  }
> = ({ operatorStatus, isResolved, key, Component, LoadingComponent }) => {
  const ResolvedComponent = Component as ComponentType<OperatorRowProps>;
  return isResolved ? (
    <ResolvedComponent key={key} operatorStatus={operatorStatus} />
  ) : (
    <AsyncComponent
      key={operatorStatus.operators[0].metadata.uid}
      operatorStatus={operatorStatus}
      loader={Component as LazyLoader<ComponentType<OperatorRowProps>>}
      LoadingComponent={LoadingComponent}
    />
  );
};

export const OperatorsPopup: FC<OperatorsPopupProps> = ({ resources, operatorSubsystems }) => {
  const { t } = useTranslation();
  const sections = [
    ...operatorSubsystems.map((o, index) => {
      const operatorResources = o.resources.reduce((acc, r) => {
        acc[r.prop] = resources[uniqueResource(r, index).prop];
        return acc;
      }, {});
      return (
        <StackItem key={o.title}>
          <OperatorsSection
            resources={operatorResources}
            getOperatorsWithStatuses={o.getOperatorsWithStatuses}
            title={o.title}
            linkTo={o.viewAllLink || resourcePath(o.resources[0].kind)}
            Row={OperatorRow}
            Component={o.operatorRowLoader}
            isResolved
          />
        </StackItem>
      );
    }),
  ].reverse();
  return (
    <Stack hasGutter>
      <StackItem>
        {t(
          'public~Operators create, configure, and manage applications by extending the Kubernetes API.',
        )}
      </StackItem>
      {sections}
    </Stack>
  );
};

export const OperatorHealthItem: FC<OperatorHealthItemProps> = ({ operatorSubsystems }) => {
  const { t } = useTranslation();
  const { watchResource, stopWatchResource, results: resources } = useDynamicK8sWatchResources();

  useEffect(() => {
    operatorSubsystems.forEach((o, index) =>
      o.resources.forEach((r) => {
        const uniqueRes = uniqueResource(r, index);
        const { prop, ...resourceConfig } = uniqueRes;
        watchResource(prop, resourceConfig);
      }),
    );
    return () => {
      operatorSubsystems.forEach((o, index) =>
        o.resources.forEach((r) => {
          const resourceKey = uniqueResource(r, index).prop;
          stopWatchResource(resourceKey);
        }),
      );
    };
  }, [watchResource, stopWatchResource, operatorSubsystems]);

  const healthStatuses = operatorSubsystems.map((o, index) => {
    const operatorResources = o.resources.reduce((acc, r) => {
      acc[r.prop] = resources[uniqueResource(r, index).prop] || {};
      return acc;
    }, {});
    if (Object.keys(operatorResources).some((resource) => operatorResources[resource].loadError)) {
      return { health: HealthState.NOT_AVAILABLE };
    }
    if (Object.keys(operatorResources).some((resource) => !operatorResources[resource].loaded)) {
      return { health: HealthState.LOADING };
    }
    const operatorStatuses = o.getOperatorsWithStatuses(operatorResources);
    if (!operatorStatuses.length) {
      return { health: HealthState.OK };
    }
    const importantStatuses = getMostImportantStatuses(operatorStatuses);
    return {
      health: importantStatuses[0].status.health,
      count: importantStatuses.length,
    };
  });

  const operatorsHealth = getOperatorsHealthState(healthStatuses, t);

  return (
    <HealthItem
      title={t('public~Operators')}
      state={operatorsHealth.health}
      details={operatorsHealth.detailMessage}
      popupTitle={t('public~Operator status')}
    >
      <OperatorsPopup resources={resources} operatorSubsystems={operatorSubsystems} />
    </HealthItem>
  );
};

export const URLHealthItem: FC<URLHealthItemProps> = ({ subsystem, models }) => {
  const { t } = useTranslation();

  const urls = useMemo(() => [{ url: subsystem.url, fetch: subsystem.fetch }], [
    subsystem.url,
    subsystem.fetch,
  ]);
  const { urlResults } = useDashboardResources({ urls });
  const modelExists =
    subsystem.additionalResource && !!models.get(subsystem.additionalResource.kind);
  const [k8sData, k8sLoaded, k8sLoadError] = useK8sWatchResource(
    modelExists ? subsystem.additionalResource : null,
  );

  const healthResult = urlResults.getIn([subsystem.url, 'data']);
  const healthResultError = urlResults.getIn([subsystem.url, 'loadError']);

  const k8sResult = modelExists
    ? { data: k8sData, loaded: k8sLoaded, loadError: k8sLoadError }
    : null;

  const healthState = subsystem.healthHandler?.(healthResult, healthResultError, k8sResult) ?? {
    state: HealthState.NOT_AVAILABLE,
    message: healthStateMessage(HealthState.NOT_AVAILABLE, t),
  };

  const PopupComponent = subsystem?.popupComponent;

  return (
    <HealthItem
      title={subsystem.title}
      state={healthState.state}
      details={healthState.message}
      popupTitle={subsystem.popupTitle}
    >
      {PopupComponent && (
        <PopupComponent
          healthResult={healthResult}
          healthResultError={healthResultError}
          k8sResult={k8sResult}
        />
      )}
    </HealthItem>
  );
};

export const PrometheusHealthItem: FC<PrometheusHealthItemProps> = ({ subsystem, models }) => {
  const { t } = useTranslation();
  const { infrastructure } = useContext(ClusterDashboardContext);

  const prometheusQueries = useMemo(() => subsystem.queries.map((query) => ({ query })), [
    subsystem.queries,
  ]);
  const { prometheusResults } = useDashboardResources({ prometheusQueries });

  const modelExists =
    subsystem.additionalResource && !!models.get(subsystem.additionalResource.kind);
  const [k8sData, k8sLoaded, k8sLoadError] = useK8sWatchResource(
    modelExists ? subsystem.additionalResource : null,
  );

  const queryResults = useMemo(
    () =>
      subsystem.queries.map((q) => {
        const [response, error] = getPrometheusQueryResponse(prometheusResults, q);
        return {
          response,
          error,
        };
      }),
    [prometheusResults, subsystem.queries],
  );

  // Format K8s result to match expected structure
  const k8sResult = modelExists
    ? { data: k8sData, loaded: k8sLoaded, loadError: k8sLoadError }
    : null;

  const healthState: SubsystemHealth = subsystem.healthHandler?.(
    queryResults,
    t,
    k8sResult,
    infrastructure,
  ) ?? { state: HealthState.NOT_AVAILABLE, message: 'Health handler not available' };

  const PopupComponent = subsystem?.popupComponent;

  return (
    <HealthItem
      title={subsystem.title}
      state={healthState.state}
      details={healthState.message}
      popupTitle={subsystem.popupTitle}
      popupClassname={subsystem.popupClassname}
      popupKeepOnOutsideClick={subsystem.popupKeepOnOutsideClick}
      popupBodyContent={
        PopupComponent
          ? (hide) => <PopupComponent responses={queryResults} k8sResult={k8sResult} hide={hide} />
          : undefined
      }
    />
  );
};

export const ResourceHealthItem: FC<ResourceHealthItemProps> = ({ subsystem, namespace }) => {
  const { t } = useTranslation();

  const { title, resources, healthHandler, popupComponent: PopupComponent, popupTitle } = subsystem;

  const resourcesWithNamespace: WatchK8sResources<ResourcesObject> = useMemo(() => {
    return {
      ...resources,
      ...(resources.imageManifestVuln && {
        imageManifestVuln: { ...resources.imageManifestVuln, namespace },
      }),
    };
  }, [resources, namespace]);

  const resourcesResult: WatchK8sResults<ResourcesObject> = useK8sWatchResources(
    resourcesWithNamespace,
  );
  const healthState: SubsystemHealth = healthHandler?.(resourcesResult, t) ?? {
    state: HealthState.NOT_AVAILABLE,
    message: healthStateMessage(HealthState.NOT_AVAILABLE, t),
  };

  return (
    <HealthItem
      title={title}
      state={healthState.state}
      details={healthState.message}
      popupTitle={popupTitle}
    >
      {PopupComponent && resourcesResult && (
        <PopupComponent {...resourcesResult} namespace={namespace} />
      )}
    </HealthItem>
  );
};

type OperatorHealthItemProps = {
  operatorSubsystems: ResolvedExtension<DashboardsOverviewHealthOperator>['properties'][];
};

type URLHealthItemProps = {
  subsystem: ResolvedExtension<DashboardsOverviewHealthURLSubsystem<any>>['properties'];
  models: ImmutableMap<string, K8sKind>;
};

type PrometheusHealthItemProps = {
  subsystem: ResolvedExtension<DashboardsOverviewHealthPrometheusSubsystem>['properties'];
  models: ImmutableMap<string, K8sKind>;
};

type ResourceHealthItemProps = {
  subsystem: ResolvedExtension<DashboardsOverviewHealthResourceSubsystem>['properties'];
  namespace?: string;
};

type OperatorsPopupProps = {
  resources: FirehoseResourcesResult;
  operatorSubsystems: ResolvedExtension<DashboardsOverviewHealthOperator>['properties'][];
};
