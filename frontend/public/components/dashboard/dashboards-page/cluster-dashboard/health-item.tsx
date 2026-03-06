import * as React from 'react';
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
import { K8sKind } from '../../../../module/k8s';
import { FirehoseResourcesResult } from '../../../utils/types';
import { AsyncComponent, LazyLoader } from '../../../utils/async';
import { resourcePath } from '../../../utils/resource-link';
import { useK8sWatchResources } from '../../../utils/k8s-watch-hook';
import { withDashboardResources, DashboardItemProps } from '../../with-dashboard-resources';
import { uniqueResource } from './utils';
import { getPrometheusQueryResponse } from '../../../../actions/dashboards';
import { ClusterDashboardContext } from './context';

const OperatorRow: React.FC<
  OperatorRowProps & {
    LoadingComponent: () => JSX.Element;
    Component:
      | React.ComponentType<OperatorRowProps>
      | LazyLoader<React.ComponentType<OperatorRowProps>>;
    key: string;
    isResolved: boolean;
  }
> = ({ operatorStatus, isResolved, key, Component, LoadingComponent }) => {
  const ResolvedComponent = Component as React.ComponentType<OperatorRowProps>;
  return isResolved ? (
    <ResolvedComponent key={key} operatorStatus={operatorStatus} />
  ) : (
    <AsyncComponent
      key={operatorStatus.operators[0].metadata.uid}
      operatorStatus={operatorStatus}
      loader={Component as LazyLoader<React.ComponentType<OperatorRowProps>>}
      LoadingComponent={LoadingComponent}
    />
  );
};

export const OperatorsPopup: React.FC<OperatorsPopupProps> = ({
  resources,
  operatorSubsystems,
}) => {
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

export const OperatorHealthItem = withDashboardResources<OperatorHealthItemProps>(
  ({ resources, watchK8sResource, stopWatchK8sResource, operatorSubsystems }) => {
    const { t } = useTranslation();
    React.useEffect(() => {
      operatorSubsystems.forEach((o, index) =>
        o.resources.forEach((r) => watchK8sResource(uniqueResource(r, index))),
      );
      return () => {
        operatorSubsystems.forEach((o, index) =>
          o.resources.forEach((r) => stopWatchK8sResource(uniqueResource(r, index))),
        );
      };
    }, [watchK8sResource, stopWatchK8sResource, operatorSubsystems]);

    const healthStatuses = operatorSubsystems.map((o, index) => {
      const operatorResources = o.resources.reduce((acc, r) => {
        acc[r.prop] = resources[uniqueResource(r, index).prop] || {};
        return acc;
      }, {});
      if (
        Object.keys(operatorResources).some((resource) => operatorResources[resource].loadError)
      ) {
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
  },
);

export const URLHealthItem = withDashboardResources<URLHealthItemProps>(
  ({
    watchURL,
    stopWatchURL,
    urlResults,
    resources,
    watchK8sResource,
    stopWatchK8sResource,
    subsystem,
    models,
  }) => {
    const { t } = useTranslation();

    const modelExists =
      subsystem.additionalResource && !!models.get(subsystem.additionalResource.kind);
    React.useEffect(() => {
      watchURL(subsystem.url, subsystem.fetch);
      if (modelExists) {
        watchK8sResource(subsystem.additionalResource);
      }
      return () => {
        stopWatchURL(subsystem.url);
        if (modelExists) {
          stopWatchK8sResource(subsystem.additionalResource);
        }
      };
    }, [watchURL, stopWatchURL, watchK8sResource, stopWatchK8sResource, subsystem, modelExists]);

    const healthResult = urlResults.getIn([subsystem.url, 'data']);
    const healthResultError = urlResults.getIn([subsystem.url, 'loadError']);

    const k8sResult = subsystem.additionalResource
      ? resources[subsystem.additionalResource.prop]
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
  },
);

export const PrometheusHealthItem = withDashboardResources<PrometheusHealthItemProps>(
  ({
    watchK8sResource,
    stopWatchK8sResource,
    resources,
    watchPrometheus,
    stopWatchPrometheusQuery,
    prometheusResults,
    subsystem,
    models,
  }) => {
    const { t } = useTranslation();
    const { infrastructure } = React.useContext(ClusterDashboardContext);

    const modelExists =
      subsystem.additionalResource && !!models.get(subsystem.additionalResource.kind);
    React.useEffect(() => {
      subsystem.queries.forEach((q) => watchPrometheus(q));
      if (modelExists) {
        watchK8sResource(subsystem.additionalResource);
      }
      return () => {
        subsystem.queries.forEach((q) => stopWatchPrometheusQuery(q));
        if (modelExists) {
          stopWatchK8sResource(subsystem.additionalResource);
        }
      };
    }, [
      watchK8sResource,
      stopWatchK8sResource,
      watchPrometheus,
      stopWatchPrometheusQuery,
      subsystem,
      modelExists,
    ]);

    const queryResults = React.useMemo(
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
    const k8sResult = subsystem.additionalResource
      ? resources[subsystem.additionalResource.prop]
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
            ? (hide) => (
                <PopupComponent responses={queryResults} k8sResult={k8sResult} hide={hide} />
              )
            : undefined
        }
      />
    );
  },
);

export const ResourceHealthItem: React.FC<ResourceHealthItemProps> = ({ subsystem, namespace }) => {
  const { t } = useTranslation();

  const { title, resources, healthHandler, popupComponent: PopupComponent, popupTitle } = subsystem;

  const resourcesWithNamespace: WatchK8sResources<ResourcesObject> = React.useMemo(() => {
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

type OperatorHealthItemProps = DashboardItemProps & {
  operatorSubsystems: ResolvedExtension<DashboardsOverviewHealthOperator>['properties'][];
};

type URLHealthItemProps = DashboardItemProps & {
  subsystem: ResolvedExtension<DashboardsOverviewHealthURLSubsystem<any>>['properties'];
  models: ImmutableMap<string, K8sKind>;
};

type PrometheusHealthItemProps = DashboardItemProps & {
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
