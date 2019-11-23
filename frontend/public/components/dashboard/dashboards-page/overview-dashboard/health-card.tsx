import * as React from 'react';
import { connect } from 'react-redux';

import * as plugins from '../../../../plugins';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { DashboardCardPopupLink } from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import AlertsBody from '@console/shared/src/components/dashboard/health-card/AlertsBody';
import AlertItem from '@console/shared/src/components/dashboard/health-card/AlertItem';
import { getAlerts } from '@console/shared/src/components/dashboard/health-card/utils';
import HealthBody from '@console/shared/src/components/dashboard/health-card/HealthBody';
import HealthItem from '@console/shared/src/components/dashboard/health-card/HealthItem';
import { HealthState } from '@console/shared/src/components/dashboard/health-card/states';
import { coFetch } from '../../../../co-fetch';
import { FLAGS } from '../../../../const';
import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import { getBrandingDetails } from '../../../masthead';
import { RootState } from '../../../../redux';
import {
  connectToFlags,
  flagPending,
  featureReducerName,
  FlagsObject,
  WithFlagsProps,
} from '../../../../reducers/features';
import { uniqueResource } from './utils';
import {
  isDashboardsOverviewHealthSubsystem,
  isDashboardsOverviewHealthURLSubsystem,
  isDashboardsOverviewHealthPrometheusSubsystem,
} from '@console/plugin-sdk';
import { PrometheusResponse } from '../../../graphs';
import { ALERTS_KEY } from '../../../../actions/dashboards';
import { PrometheusRulesResponse, alertURL } from '../../../monitoring';

export const HEALTHY = 'is healthy';
export const ERROR = 'is in an error state';

const getClusterHealth = (subsystemStates: Array<SubsystemHealth>): ClusterHealth => {
  let healthState: ClusterHealth = { state: HealthState.OK, message: 'Cluster is healthy' };
  const subsystemBySeverity = {
    error: subsystemStates.filter((subsystem) => subsystem.state === HealthState.ERROR),
    warning: subsystemStates.filter((subsystem) => subsystem.state === HealthState.WARNING),
    loading: subsystemStates.filter((subsystem) => subsystem.state === HealthState.LOADING),
  };

  if (subsystemBySeverity.loading.length > 0) {
    healthState = { state: HealthState.LOADING, message: null };
  } else if (subsystemBySeverity.error.length > 0) {
    healthState =
      subsystemBySeverity.error.length === 1
        ? subsystemBySeverity.error[0]
        : {
            state: HealthState.ERROR,
            message: 'Multiple errors',
            details: 'Cluster health is degraded',
          };
  } else if (subsystemBySeverity.warning.length > 0) {
    healthState =
      subsystemBySeverity.warning.length === 1
        ? subsystemBySeverity.warning[0]
        : {
            state: HealthState.WARNING,
            message: 'Multiple warnings',
            details: 'Cluster health is degraded',
          };
  }

  return healthState;
};

const getName = (openshiftFlag: boolean): string =>
  openshiftFlag ? getBrandingDetails().productName : 'Kubernetes';

const getK8sHealthState = (openshiftFlag: boolean, k8sHealth: any): SubsystemHealth => {
  if (!k8sHealth) {
    return { state: HealthState.LOADING };
  }
  return k8sHealth === 'ok'
    ? { message: `${getName(openshiftFlag)} ${HEALTHY}`, state: HealthState.OK }
    : { message: `${getName(openshiftFlag)} ${ERROR}`, state: HealthState.ERROR };
};

const fetchK8sHealth = async (url) => {
  const response = await coFetch(url);
  return response.text();
};

const mapStateToProps = (state: RootState) => ({
  openshiftFlag: state[featureReducerName].get(FLAGS.OPENSHIFT),
});

const getSubsystems = (flags: FlagsObject) =>
  plugins.registry
    .getDashboardsOverviewHealthSubsystems()
    .filter((e) => plugins.registry.isExtensionInUse(e, flags));

const HealthCard_ = connect(mapStateToProps)(
  ({
    watchURL,
    stopWatchURL,
    watchPrometheus,
    stopWatchPrometheusQuery,
    watchAlerts,
    stopWatchAlerts,
    watchK8sResource,
    stopWatchK8sResource,
    resources,
    urlResults,
    prometheusResults,
    alertsResults,
    openshiftFlag,
    flags = {},
  }: HealthProps) => {
    React.useEffect(() => {
      const subsystems = getSubsystems(flags);
      watchURL('healthz', fetchK8sHealth);
      watchAlerts();

      subsystems.forEach((subsystem, index) => {
        if (isDashboardsOverviewHealthURLSubsystem(subsystem)) {
          const { url, fetch } = subsystem.properties;
          watchURL(url, fetch);
        } else if (isDashboardsOverviewHealthPrometheusSubsystem(subsystem)) {
          const { queries, additionalResource } = subsystem.properties;
          queries.forEach((query) => watchPrometheus(query));
          if (additionalResource) {
            watchK8sResource(uniqueResource(additionalResource, index));
          }
        }
      });

      return () => {
        stopWatchURL('healthz');
        stopWatchAlerts();

        subsystems.forEach((subsystem, index) => {
          if (isDashboardsOverviewHealthURLSubsystem(subsystem)) {
            stopWatchURL(subsystem.properties.url);
          } else if (isDashboardsOverviewHealthPrometheusSubsystem(subsystem)) {
            const { queries, additionalResource } = subsystem.properties;
            queries.forEach((query) => stopWatchPrometheusQuery(query));
            if (additionalResource) {
              stopWatchK8sResource(uniqueResource(additionalResource, index));
            }
          }
        });
      };
    } /* eslint-disable react-hooks/exhaustive-deps */, [
      // TODO: to be removed: use JSON.stringify(flags) to avoid deep comparison of flags object
      watchURL,
      stopWatchURL,
      watchPrometheus,
      stopWatchPrometheusQuery,
      watchAlerts,
      stopWatchAlerts,
      watchK8sResource,
      stopWatchK8sResource,
      stopWatchAlerts,
      JSON.stringify(flags),
    ]);
    /* eslint-enable react-hooks/exhaustive-deps */

    const subsystems = getSubsystems(flags);
    const k8sHealth = urlResults.getIn(['healthz', 'data']);
    const k8sHealthError = urlResults.getIn(['healthz', 'loadError']);
    const k8sHealthState = getK8sHealthState(openshiftFlag, k8sHealth || k8sHealthError);

    const subsystemsHealths = subsystems.map((subsystem, index) => {
      if (isDashboardsOverviewHealthURLSubsystem(subsystem)) {
        const urlData = urlResults.getIn([subsystem.properties.url, 'data']);
        const urlError = urlResults.getIn([subsystem.properties.url, 'loadError']);
        return subsystem.properties.healthHandler(urlData, !!urlError);
      }
      const queriesData = subsystem.properties.queries.map(
        (query) => prometheusResults.getIn([query, 'data']) as PrometheusResponse,
      );
      const queriesError = subsystem.properties.queries.map((query) =>
        prometheusResults.getIn([query, 'loadError']),
      );
      const resource = subsystem.properties.additionalResource
        ? resources[uniqueResource(subsystem.properties.additionalResource, index).prop]
        : null;
      return subsystem.properties.healthHandler(queriesData, queriesError, resource);
    });

    const healthState = getClusterHealth([k8sHealthState, ...subsystemsHealths]);
    const alertsResponse = alertsResults.getIn([ALERTS_KEY, 'data']) as PrometheusRulesResponse;
    const alerts = getAlerts(alertsResponse);

    return (
      <DashboardCard>
        <DashboardCardHeader>
          <DashboardCardTitle>Cluster Health</DashboardCardTitle>
          {subsystems.length > 0 && !flagPending(openshiftFlag) && (
            <DashboardCardPopupLink linkTitle="See all" popupTitle="Subsystem Health">
              <HealthItem
                message={getName(openshiftFlag)}
                details={k8sHealthState.message}
                state={k8sHealthState.state}
              />
              {subsystemsHealths.map((subsystem, index) => (
                <div key={index}>
                  <div className="co-health-card__separator" />
                  <HealthItem
                    message={subsystems[index].properties.title}
                    details={subsystem.message}
                    state={subsystem.state}
                  />
                </div>
              ))}
            </DashboardCardPopupLink>
          )}
        </DashboardCardHeader>
        <DashboardCardBody isLoading={flagPending(openshiftFlag)}>
          <HealthBody>
            <HealthItem
              state={healthState.state}
              message={healthState.message}
              details={healthState.details}
            />
          </HealthBody>
        </DashboardCardBody>

        {alerts.length > 0 && (
          <>
            <DashboardCardHeader className="co-health-card__alerts-border">
              <DashboardCardTitle>Alerts</DashboardCardTitle>
            </DashboardCardHeader>
            <DashboardCardBody isLoading={flagPending(openshiftFlag)}>
              <AlertsBody>
                {alerts.map((alert) => (
                  <AlertItem key={alertURL(alert, alert.rule.id)} alert={alert} />
                ))}
              </AlertsBody>
            </DashboardCardBody>
          </>
        )}
      </DashboardCard>
    );
  },
);

export const HealthCard = connectToFlags(
  ...plugins.registry.getRequiredFlags([isDashboardsOverviewHealthSubsystem]),
)(withDashboardResources(HealthCard_));

type ClusterHealth = {
  state: HealthState;
  message?: string;
  details?: string;
};

export type SubsystemHealth = {
  message?: string;
  state: HealthState;
};

type HealthProps = DashboardItemProps &
  WithFlagsProps & {
    openshiftFlag: boolean;
  };
