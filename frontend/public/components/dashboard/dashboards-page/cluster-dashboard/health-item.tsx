import * as React from 'react';
import { Map as ImmutableMap } from 'immutable';
import { useTranslation } from 'react-i18next';
import {
  DashboardsOverviewHealthOperator,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewHealthResourceSubsystem,
  SubsystemHealth,
  OperatorRowProps,
  LazyLoader,
} from '@console/plugin-sdk';
import {
  ResolvedExtension,
  DashboardsOverviewHealthOperator as DynamicDashboardsOverviewHealthOperator,
  DashboardsOverviewHealthURLSubsystem as DynamicDashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthPrometheusSubsystem as DynamicDashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewHealthResourceSubsystem as DynamicDashboardsOverviewHealthResourceSubsystem,
} from '@console/dynamic-plugin-sdk';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { OperatorsSection } from '@console/shared/src/components/dashboard/status-card/OperatorStatusBody';
import {
  getOperatorsHealthState,
  getMostImportantStatuses,
} from '@console/shared/src/components/dashboard/status-card/state-utils';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { K8sKind } from '../../../../module/k8s';
import { FirehoseResourcesResult, AsyncComponent, resourcePath } from '../../../utils';
import {
  ResourcesObject,
  useK8sWatchResources,
  WatchK8sResources,
  WatchK8sResults,
} from '../../../utils/k8s-watch-hook';
import { withDashboardResources, DashboardItemProps } from '../../with-dashboard-resources';
import { uniqueResource } from './utils';
import { getPrometheusQueryResponse } from '../../../../actions/dashboards';
import { ClusterDashboardContext } from './context';

const OperatorRow: React.FC<OperatorRowProps & {
  LoadingComponent: () => JSX.Element;
  Component: React.ComponentType<OperatorRowProps> | LazyLoader<OperatorRowProps>;
  key: string;
  isResolved: boolean;
}> = ({ operatorStatus, isResolved, key, Component, LoadingComponent }) => {
  const ResolvedComponent = Component as React.ComponentType<OperatorRowProps>;
  return isResolved ? (
    <ResolvedComponent key={key} operatorStatus={operatorStatus} />
  ) : (
    <AsyncComponent
      key={operatorStatus.operators[0].metadata.uid}
      operatorStatus={operatorStatus}
      loader={Component}
      LoadingComponent={LoadingComponent}
    />
  );
};

export const OperatorsPopup: React.FC<OperatorsPopupProps> = ({
  resources,
  operatorExtensions,
  dynamicOperatorSubsystems,
}) => {
  const { t } = useTranslation();
  const sections = [
    ...operatorExtensions.map((o, index) => {
      const operatorResources = o.resources.reduce((acc, r) => {
        acc[r.prop] = resources[uniqueResource(r, index).prop];
        return acc;
      }, {});
      return (
        <OperatorsSection
          key={o.title}
          resources={operatorResources}
          getOperatorsWithStatuses={o.getOperatorsWithStatuses}
          title={o.title}
          linkTo={o.viewAllLink || resourcePath(o.resources[0].kind)}
          Row={OperatorRow}
          Component={o.operatorRowLoader}
          isResolved={false}
        />
      );
    }),
    ...dynamicOperatorSubsystems.map((o, index) => {
      const operatorResources = o.resources.reduce((acc, r) => {
        acc[r.prop] = resources[uniqueResource(r, index).prop];
        return acc;
      }, {});
      return (
        <OperatorsSection
          key={o.title}
          resources={operatorResources}
          getOperatorsWithStatuses={o.getOperatorsWithStatuses}
          title={o.title}
          linkTo={o.viewAllLink || resourcePath(o.resources[0].kind)}
          Row={OperatorRow}
          Component={o.operatorRowLoader}
          isResolved
        />
      );
    }),
  ].reverse();
  return (
    <>
      {t(
        'public~Operators create, configure, and manage applications by extending the Kubernetes API.',
      )}
      {sections}
    </>
  );
};

export const OperatorHealthItem = withDashboardResources<OperatorHealthItemProps>(
  ({
    resources,
    watchK8sResource,
    stopWatchK8sResource,
    operatorExtensions,
    dynamicOperatorSubsystems,
  }) => {
    const { t } = useTranslation();
    React.useEffect(() => {
      operatorExtensions.forEach((o, index) =>
        o.resources.forEach((r) => watchK8sResource(uniqueResource(r, index))),
      );
      return () => {
        operatorExtensions.forEach((o, index) =>
          o.resources.forEach((r) => stopWatchK8sResource(uniqueResource(r, index))),
        );
      };
    }, [watchK8sResource, stopWatchK8sResource, operatorExtensions]);

    const healthStatuses = operatorExtensions.map((o, index) => {
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
        <OperatorsPopup
          resources={resources}
          operatorExtensions={operatorExtensions}
          dynamicOperatorSubsystems={dynamicOperatorSubsystems}
        />
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
    const modelExists =
      subsystem.additionalResource && !!models.get(subsystem.additionalResource.kind);
    React.useEffect(() => {
      watchURL(
        subsystem.url,
        (subsystem as DashboardsOverviewHealthURLSubsystem<any>['properties']).fetch
          ? (subsystem as DashboardsOverviewHealthURLSubsystem<any>['properties']).fetch
          : null,
      );
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
    const healthState = subsystem.healthHandler(healthResult, healthResultError, k8sResult);

    return (
      <HealthItem
        title={subsystem.title}
        state={healthState.state}
        details={healthState.message}
        popupTitle={subsystem.popupTitle}
      >
        {subsystem.popupComponent && (
          <AsyncComponent
            loader={subsystem.popupComponent}
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
    const healthState = subsystem.healthHandler(queryResults, t, k8sResult, infrastructure);

    return (
      <HealthItem
        title={subsystem.title}
        state={healthState.state}
        details={healthState.message}
        popupTitle={subsystem.popupTitle}
      >
        {subsystem.popupComponent && (
          <AsyncComponent
            loader={subsystem.popupComponent}
            responses={queryResults}
            k8sResult={k8sResult}
          />
        )}
      </HealthItem>
    );
  },
);

export const ResourceHealthItem: React.FC<ResourceHealthItemProps> = ({ subsystem, namespace }) => {
  const { t } = useTranslation();

  const { title, resources, healthHandler, popupComponent, popupTitle } = subsystem;

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
  const healthState: SubsystemHealth = healthHandler(resourcesResult, t);

  return (
    <HealthItem
      title={title}
      state={healthState.state}
      details={healthState.message}
      popupTitle={popupTitle}
    >
      {popupComponent && resourcesResult && (
        <AsyncComponent loader={popupComponent} {...resourcesResult} namespace={namespace} />
      )}
    </HealthItem>
  );
};

type OperatorHealthItemProps = DashboardItemProps & {
  operatorExtensions: DashboardsOverviewHealthOperator['properties'][];
  dynamicOperatorSubsystems: ResolvedExtension<
    DynamicDashboardsOverviewHealthOperator
  >['properties'][];
};

type URLHealthItemProps = DashboardItemProps & {
  subsystem:
    | DashboardsOverviewHealthURLSubsystem<any>['properties']
    | ResolvedExtension<DynamicDashboardsOverviewHealthURLSubsystem<any>>['properties'];
  models: ImmutableMap<string, K8sKind>;
};

type PrometheusHealthItemProps = DashboardItemProps & {
  subsystem:
    | DashboardsOverviewHealthPrometheusSubsystem['properties']
    | ResolvedExtension<DynamicDashboardsOverviewHealthPrometheusSubsystem>['properties'];
  models: ImmutableMap<string, K8sKind>;
};

type ResourceHealthItemProps = {
  subsystem:
    | DashboardsOverviewHealthResourceSubsystem['properties']
    | ResolvedExtension<DynamicDashboardsOverviewHealthResourceSubsystem>['properties'];
  namespace?: string;
};

type OperatorsPopupProps = {
  resources: FirehoseResourcesResult;
  operatorExtensions: DashboardsOverviewHealthOperator['properties'][];
  dynamicOperatorSubsystems: ResolvedExtension<
    DynamicDashboardsOverviewHealthOperator
  >['properties'][];
};
