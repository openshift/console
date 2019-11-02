import * as React from 'react';
import * as _ from 'lodash-es';
import {
  isDashboardsOverviewHealthSubsystem,
  isDashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthPrometheusSubsystem,
} from '@console/plugin-sdk';
import { ArrowCircleUpIcon } from '@patternfly/react-icons';
import { Gallery, GalleryItem, Button } from '@patternfly/react-core';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { withDashboardResources, DashboardItemProps } from '../../with-dashboard-resources';
import { getAlerts } from '@console/shared/src/components/dashboard/health-card/utils';
import AlertItem, {
  StatusItem,
} from '@console/shared/src/components/dashboard/status-card/AlertItem';
import { ALERTS_KEY } from '../../../../actions/dashboards';
import { connectToFlags, FlagsObject } from '../../../../reducers/features';
import * as plugins from '../../../../plugins';
import { FirehoseResource, AsyncComponent } from '../../../utils';
import { PrometheusResponse } from '../../../graphs';
import { PrometheusRulesResponse, alertURL } from '../../../monitoring';
import { ClusterVersionKind, referenceForModel, hasAvailableUpdates } from '../../../../module/k8s';
import { ClusterVersionModel } from '../../../../models';
import { clusterUpdateModal } from '../../../modals/cluster-update-modal';

const getSubsystems = (flags: FlagsObject) =>
  plugins.registry
    .getDashboardsOverviewHealthSubsystems()
    .filter((e) => plugins.registry.isExtensionInUse(e, flags));

const URLHealthItem = withDashboardResources(
  ({
    watchURL,
    stopWatchURL,
    urlResults,
    resources,
    watchK8sResource,
    stopWatchK8sResource,
    subsystem,
  }: URLHealthItemProps) => {
    React.useEffect(() => {
      watchURL(subsystem.url, subsystem.fetch);
      if (subsystem.additionalResource) {
        watchK8sResource(subsystem.additionalResource);
      }
      return () => {
        stopWatchURL(subsystem.url);
        if (subsystem.additionalResource) {
          stopWatchK8sResource(subsystem.additionalResource);
        }
      };
    }, [watchURL, stopWatchURL, watchK8sResource, stopWatchK8sResource, subsystem]);

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

const PrometheusHealthItem = withDashboardResources(
  ({
    watchK8sResource,
    stopWatchK8sResource,
    resources,
    watchPrometheus,
    stopWatchPrometheusQuery,
    prometheusResults,
    subsystem,
  }: PrometheusHealthItem) => {
    React.useEffect(() => {
      subsystem.queries.forEach((q) => watchPrometheus(q));
      if (subsystem.additionalResource) {
        watchK8sResource(subsystem.additionalResource);
      }
      return () => {
        subsystem.queries.forEach((q) => stopWatchPrometheusQuery(q));
        if (subsystem.additionalResource) {
          stopWatchK8sResource(subsystem.additionalResource);
        }
      };
    }, [
      watchK8sResource,
      stopWatchK8sResource,
      watchPrometheus,
      stopWatchPrometheusQuery,
      subsystem,
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

const cvResource: FirehoseResource = {
  kind: referenceForModel(ClusterVersionModel),
  namespaced: false,
  name: 'version',
  isList: false,
  prop: 'cv',
};

const ClusterAlerts = withDashboardResources(
  ({
    watchAlerts,
    stopWatchAlerts,
    alertsResults,
    watchK8sResource,
    stopWatchK8sResource,
    resources,
  }) => {
    React.useEffect(() => {
      watchAlerts();
      watchK8sResource(cvResource);
      return () => {
        stopWatchAlerts();
        stopWatchK8sResource(cvResource);
      };
    }, [watchAlerts, stopWatchAlerts, watchK8sResource, stopWatchK8sResource]);

    const alertsResponse = alertsResults.getIn([ALERTS_KEY, 'data']) as PrometheusRulesResponse;
    const alertsResponseError = alertsResults.getIn([ALERTS_KEY, 'loadError']);
    const alerts = getAlerts(alertsResponse);

    const cv = _.get(resources.cv, 'data') as ClusterVersionKind;
    const cvLoaded = _.get(resources.cv, 'loaded');
    const LinkComponent = React.useCallback(
      () => (
        <Button
          className="co-status-card__link-button"
          variant="link"
          onClick={() => clusterUpdateModal({ cv })}
        >
          View details
        </Button>
      ),
      [cv],
    );
    const UpdateIcon = React.useCallback(
      () => <ArrowCircleUpIcon className="update-pending" />,
      [],
    );

    return (
      <AlertsBody
        isLoading={!(alertsResponse && cvLoaded)}
        error={alertsResponseError}
        emptyMessage="No cluster alerts or messages"
      >
        {(hasAvailableUpdates(cv) || alerts.length) && (
          <>
            {hasAvailableUpdates(cv) && (
              <StatusItem
                Icon={UpdateIcon}
                message="A cluster version update is available"
                LinkComponent={LinkComponent}
              />
            )}
            {alerts.map((alert) => (
              <AlertItem key={alertURL(alert, alert.rule.id)} alert={alert} />
            ))}
          </>
        )}
      </AlertsBody>
    );
  },
);

export const StatusCard = connectToFlags(
  ...plugins.registry.getRequiredFlags([isDashboardsOverviewHealthSubsystem]),
)(({ flags }) => {
  const subsystems = getSubsystems(flags);
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <Gallery className="co-overview-status__health" gutter="md">
            {subsystems.map((subsystem) => (
              <GalleryItem key={subsystem.properties.title}>
                {isDashboardsOverviewHealthURLSubsystem(subsystem) ? (
                  <URLHealthItem subsystem={subsystem.properties} />
                ) : (
                  <PrometheusHealthItem subsystem={subsystem.properties} />
                )}
              </GalleryItem>
            ))}
          </Gallery>
        </HealthBody>
        <ClusterAlerts />
      </DashboardCardBody>
    </DashboardCard>
  );
});

type URLHealthItemProps = DashboardItemProps & {
  subsystem: DashboardsOverviewHealthURLSubsystem<any>['properties'];
};

type PrometheusHealthItem = DashboardItemProps & {
  subsystem: DashboardsOverviewHealthPrometheusSubsystem['properties'];
};
