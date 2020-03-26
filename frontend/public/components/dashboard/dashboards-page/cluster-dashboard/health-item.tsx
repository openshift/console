import * as React from 'react';
import { Map as ImmutableMap } from 'immutable';
import {
  DashboardsOverviewHealthOperator,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewHealthResourceSubsystem,
} from '@console/plugin-sdk';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import OperatorStatusBody, {
  OperatorsSection,
} from '@console/shared/src/components/dashboard/status-card/OperatorStatusBody';
import {
  getOperatorsHealthState,
  getMostImportantStatuses,
} from '@console/shared/src/components/dashboard/status-card/state-utils';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { K8sKind } from '../../../../module/k8s';
import { FirehoseResourcesResult, AsyncComponent, resourcePath } from '../../../utils';
import { useK8sWatchResources } from '../../../utils/k8s-watch-hook';
import { PrometheusResponse } from '../../../graphs';
import { withDashboardResources, DashboardItemProps } from '../../with-dashboard-resources';
import { uniqueResource } from './utils';

export const OperatorsPopup: React.FC<OperatorsPopupProps> = ({
  resources,
  operatorExtensions,
}) => {
  const sections = operatorExtensions
    .map((o, index) => {
      const operatorResources = o.properties.resources.reduce((acc, r) => {
        acc[r.prop] = resources[uniqueResource(r, index).prop];
        return acc;
      }, {});
      return (
        <OperatorsSection
          key={o.properties.title}
          resources={operatorResources}
          getOperatorsWithStatuses={o.properties.getOperatorsWithStatuses}
          title={o.properties.title}
          linkTo={o.properties.viewAllLink || resourcePath(o.properties.resources[0].kind)}
          rowLoader={o.properties.operatorRowLoader}
        />
      );
    })
    .reverse();
  return <OperatorStatusBody>{sections}</OperatorStatusBody>;
};

export const OperatorHealthItem = withDashboardResources<OperatorHealthItemProps>(
  ({ resources, watchK8sResource, stopWatchK8sResource, operatorExtensions }) => {
    React.useEffect(() => {
      operatorExtensions.forEach((o, index) =>
        o.properties.resources.forEach((r) => watchK8sResource(uniqueResource(r, index))),
      );
      return () => {
        operatorExtensions.forEach((o, index) =>
          o.properties.resources.forEach((r) => stopWatchK8sResource(uniqueResource(r, index))),
        );
      };
    }, [watchK8sResource, stopWatchK8sResource, operatorExtensions]);

    const healthStatuses = operatorExtensions.map((o, index) => {
      const operatorResources = o.properties.resources.reduce((acc, r) => {
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
      const operatorStatuses = o.properties.getOperatorsWithStatuses(operatorResources);
      const importantStatuses = getMostImportantStatuses(operatorStatuses);
      return {
        health: importantStatuses[0].status.health,
        count: importantStatuses.length,
      };
    });

    const PopupComponentCallback = React.useCallback(
      () => <OperatorsPopup resources={resources} operatorExtensions={operatorExtensions} />,
      [resources, operatorExtensions],
    );

    const operatorsHealth = getOperatorsHealthState(healthStatuses);

    return (
      <HealthItem
        title="Operators"
        state={operatorsHealth.health}
        details={operatorsHealth.detailMessage}
        popupTitle="Operator status"
        PopupComponent={PopupComponentCallback}
      />
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
    const healthState = subsystem.healthHandler(healthResult, healthResultError, k8sResult);

    const PopupComponentCallback = subsystem.popupComponent
      ? React.useCallback(
          () => (
            <AsyncComponent
              loader={subsystem.popupComponent}
              healthResult={healthResult}
              healthResultError={healthResultError}
              k8sResult={k8sResult}
            />
          ),
          [subsystem, healthResult, healthResultError, k8sResult],
        )
      : null;

    return (
      <HealthItem
        title={subsystem.title}
        state={healthState.state}
        details={healthState.message}
        popupTitle={subsystem.popupTitle}
        PopupComponent={PopupComponentCallback}
      />
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

    const queryResults = subsystem.queries.map(
      (q) => prometheusResults.getIn([q, 'data']) as PrometheusResponse,
    );
    const queryErrors = subsystem.queries.map((q) => prometheusResults.getIn([q, 'loadError']));

    const k8sResult = subsystem.additionalResource
      ? resources[subsystem.additionalResource.prop]
      : null;
    const healthState = subsystem.healthHandler(queryResults, queryErrors, k8sResult);

    const PopupComponentCallback = subsystem.popupComponent
      ? React.useCallback(
          () => (
            <AsyncComponent
              loader={subsystem.popupComponent}
              results={queryResults}
              errors={queryErrors}
            />
          ),
          [queryResults, queryErrors, subsystem],
        )
      : null;

    return (
      <HealthItem
        title={subsystem.title}
        state={healthState.state}
        details={healthState.message}
        popupTitle={subsystem.popupTitle}
        PopupComponent={PopupComponentCallback}
      />
    );
  },
);

export const ResourceHealthItem: React.FC<ResourceHealthItemProps> = ({ subsystem }) => {
  const { title, resources, healthHandler, popupComponent, popupTitle } = subsystem;
  const resourcesResult = useK8sWatchResources(resources);

  const healthState = healthHandler(resourcesResult);

  const PopupComponentCallback = React.useCallback(
    () => <AsyncComponent loader={popupComponent} resourcesResult={resourcesResult} />,
    [popupComponent, resourcesResult],
  );

  return (
    <HealthItem
      title={title}
      state={healthState.state}
      details={healthState.message}
      popupTitle={popupTitle}
      PopupComponent={popupComponent ? PopupComponentCallback : null}
    />
  );
};

type OperatorHealthItemProps = DashboardItemProps & {
  operatorExtensions: DashboardsOverviewHealthOperator[];
};

type URLHealthItemProps = DashboardItemProps & {
  subsystem: DashboardsOverviewHealthURLSubsystem<any>['properties'];
  models: ImmutableMap<string, K8sKind>;
};

type PrometheusHealthItemProps = DashboardItemProps & {
  subsystem: DashboardsOverviewHealthPrometheusSubsystem['properties'];
  models: ImmutableMap<string, K8sKind>;
};

type ResourceHealthItemProps = {
  subsystem: DashboardsOverviewHealthResourceSubsystem['properties'];
};

type OperatorsPopupProps = {
  resources: FirehoseResourcesResult;
  operatorExtensions: DashboardsOverviewHealthOperator[];
};
