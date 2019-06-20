import * as React from 'react';
import { connect } from 'react-redux';

import * as plugins from '../../../plugins';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardSeeAll,
} from '../../dashboard/dashboard-card';
import { HealthBody, HealthItem } from '../../dashboard/health-card';
import { HealthState } from '../../dashboard/health-card/states';
import { coFetch } from '../../../co-fetch';
import { featureReducerName, flagPending } from '../../../reducers/features';
import { FLAGS } from '../../../const';
import { withDashboardResources, DashboardItemProps } from '../with-dashboard-resources';
import { RootState } from '../../../redux';
import { getBrandingDetails } from '../../masthead';

export const HEALTHY = 'is healthy';
export const ERROR = 'is in an error state';

const getClusterHealth = (subsystemStates: Array<SubsystemHealth>): ClusterHealth => {
  let healthState: ClusterHealth = { state: HealthState.OK, message: 'Cluster is healthy' };
  const subsystemBySeverity = {
    error: subsystemStates.filter(subsystem => subsystem.state === HealthState.ERROR),
    warning: subsystemStates.filter(subsystem => subsystem.state === HealthState.WARNING),
    loading: subsystemStates.filter(subsystem => subsystem.state === HealthState.LOADING),
  };

  if (subsystemBySeverity.loading.length > 0) {
    healthState = { state: HealthState.LOADING, message: null };
  } else if (subsystemBySeverity.error.length > 0) {
    healthState =
      subsystemBySeverity.error.length === 1
        ? subsystemBySeverity.error[0]
        : { state: HealthState.ERROR, message: 'Multiple errors', details: 'Cluster health is degraded' };
  } else if (subsystemBySeverity.warning.length > 0) {
    healthState =
      subsystemBySeverity.warning.length === 1
        ? subsystemBySeverity.warning[0]
        : { state: HealthState.WARNING, message: 'Multiple warnings', details: 'Cluster health is degraded' };
  }

  return healthState;
};

const getName = (openShiftFlag: boolean): string => openShiftFlag ? getBrandingDetails().productName : 'Kubernetes';

const getK8sHealthState = (openShiftFlag: boolean, k8sHealth: any): SubsystemHealth => {
  if (!k8sHealth) {
    return { state: HealthState.LOADING };
  }
  return k8sHealth === 'ok'
    ? { message: `${getName(openShiftFlag)} ${HEALTHY}`, state: HealthState.OK }
    : { message: `${getName(openShiftFlag)} ${ERROR}`, state: HealthState.ERROR };
};

const mapStateToProps = (state: RootState) => ({
  openShiftFlag: state[featureReducerName].get(FLAGS.OPENSHIFT),
});

const fetchK8sHealth = async(url) => {
  const response = await coFetch(url);
  return response.text();
};

const HealthCard_: React.FC<HealthProps> = ({
  watchURL,
  stopWatchURL,
  watchPrometheus,
  stopWatchPrometheusQuery,
  urlResults,
  prometheusResults,
  openShiftFlag,
}) => {
  React.useEffect(() => {
    const subsystems = plugins.registry.getDashboardsOverviewHealthSubsystems();
    watchURL('healthz', fetchK8sHealth);

    subsystems.filter(plugins.isDashboardsOverviewHealthURLSubsystem).forEach(subsystem => {
      const { url, fetch } = subsystem.properties;
      watchURL(url, fetch);
    });
    subsystems.filter(plugins.isDashboardsOverviewHealthPrometheusSubsystem).forEach(subsystem => {
      const { query } = subsystem.properties;
      watchPrometheus(query);
    });
    return () => {
      stopWatchURL('healthz');

      subsystems.filter(plugins.isDashboardsOverviewHealthURLSubsystem).forEach(subsystem =>
        stopWatchURL(subsystem.properties.url)
      );
      subsystems.filter(plugins.isDashboardsOverviewHealthPrometheusSubsystem).forEach(subsystem =>
        stopWatchPrometheusQuery(subsystem.properties.query)
      );
    };
  }, [watchURL, stopWatchURL, watchPrometheus, stopWatchPrometheusQuery]);

  const subsystems = plugins.registry.getDashboardsOverviewHealthSubsystems();
  const k8sHealth = urlResults.getIn(['healthz', 'result']);
  const k8sHealthState = getK8sHealthState(openShiftFlag, k8sHealth);

  const subsystemsHealths = subsystems.map(subsystem => {
    let result;
    if (plugins.isDashboardsOverviewHealthPrometheusSubsystem(subsystem)) {
      result = prometheusResults.getIn([subsystem.properties.query, 'result']);
    } else {
      result = urlResults.getIn([subsystem.properties.url, 'result']);
    }
    return subsystem.properties.healthHandler(result);
  });

  const healthState = getClusterHealth([k8sHealthState, ...subsystemsHealths]);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Cluster Health</DashboardCardTitle>
        {subsystems.length > 0 && !flagPending(openShiftFlag) && (
          <DashboardCardSeeAll title="Subsystem health">
            <HealthItem
              message={getName(openShiftFlag)}
              details={k8sHealthState.message}
              state={k8sHealthState.state}
            />
            {subsystemsHealths.map((subsystem, index) => (
              <div key={index}>
                <div className="co-health-card__separator" />
                <HealthItem
                  className="co-health-card__subsystem-item"
                  message={subsystems[index].properties.title}
                  details={subsystem.message}
                  state={subsystem.state}
                />
              </div>
            ))}
          </DashboardCardSeeAll>
        )}
      </DashboardCardHeader>
      <DashboardCardBody isLoading={flagPending(openShiftFlag)}>
        <HealthBody>
          <HealthItem
            state={healthState.state}
            message={healthState.message}
            details={healthState.details}
          />
        </HealthBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export const HealthCard = withDashboardResources(connect(mapStateToProps)(HealthCard_));

type ClusterHealth = {
  state: HealthState;
  message?: string;
  details?: string,
};

export type SubsystemHealth = {
  message?: string;
  state: HealthState;
};

type HealthProps = DashboardItemProps & {
  openShiftFlag: boolean;
};
