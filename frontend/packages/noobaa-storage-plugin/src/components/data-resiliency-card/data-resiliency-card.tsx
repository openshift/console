import * as React from 'react';
import * as _ from 'lodash';
import { pluralize, Progress } from '@patternfly/react-core';
import { GreenCheckCircleIcon } from '@console/shared';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardHelp,
  DashboardCardTitle,
} from '@console/internal/components/dashboard/dashboard-card';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { DATA_RESILIENCE_QUERIES } from '../../queries';
import { getGaugeValue } from '../../utils';
import './data-resiliency-card.scss';

const getFormattedEta = (eta: number): string => {
  if (eta < 60) {
    return pluralize(eta, 'second');
  }
  if (eta < 3600) {
    return pluralize(Math.round(eta / 60), 'minute');
  }
  return pluralize(Math.round(eta / 3600), 'hour');
};

const DataResiliencyStatusBody: React.FC<DataResiliencyStatusBody> = ({ isResilient }) =>
  isResilient ? (
    <>
      <div className="nb-data-resiliency__title">Your data is resilient</div>
      <div className="nb-data-resiliency__icon--ok">
        <GreenCheckCircleIcon />
      </div>
    </>
  ) : (
    <GraphEmpty height="100%" />
  );

const DataResiliencyBuildBody: React.FC<DataResiliencyBuildBody> = React.memo(
  ({ progressPercentage, eta }) => {
    return (
      <>
        <div className="nb-data-resiliency__title">Rebuilding data</div>
        <Progress
          className="nb-data-resiliency__progress-bar"
          value={progressPercentage}
          title="Rebuilding in Progress"
          label={`${progressPercentage}%`}
        />
        {!_.isNil(eta) ? (
          <span className="text-secondary nb-data-resiliency__eta">
            Estimating {eta} to completion
          </span>
        ) : null}
      </>
    );
  },
);

const DataResiliency: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  React.useEffect(() => {
    Object.keys(DATA_RESILIENCE_QUERIES).forEach((key) =>
      watchPrometheus(DATA_RESILIENCE_QUERIES[key]),
    );
    return () =>
      Object.keys(DATA_RESILIENCE_QUERIES).forEach((key) =>
        stopWatchPrometheusQuery(DATA_RESILIENCE_QUERIES[key]),
      );
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const rebuildProgressQueryResult = prometheusResults.getIn([
    DATA_RESILIENCE_QUERIES.REBUILD_PROGRESS_QUERY,
    'data',
  ]) as PrometheusResponse;
  const rebuildProgressQueryResultError = prometheusResults.getIn([
    DATA_RESILIENCE_QUERIES.REBUILD_PROGRESS_QUERY,
    'loadError',
  ]);

  const etaQueryResult = prometheusResults.getIn([
    DATA_RESILIENCE_QUERIES.REBUILD_TIME_QUERY,
    'data',
  ]) as PrometheusResponse;
  const etaQueryResultError = prometheusResults.getIn([
    DATA_RESILIENCE_QUERIES.REBUILD_TIME_QUERY,
    'loadError',
  ]);

  const error = rebuildProgressQueryResultError || etaQueryResultError;

  const rebuildProgress = getGaugeValue(rebuildProgressQueryResult);
  const eta = getGaugeValue(etaQueryResult);

  const formattedRebuildProgress = rebuildProgress
    ? Number(Number(rebuildProgress).toFixed(1))
    : null;
  const formattedEta = eta ? getFormattedEta(Number(eta)) : null;

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Data Resiliency</DashboardCardTitle>
        <DashboardCardHelp>
          Data resiliency is the ability of stored objects to recover and continue operating in the
          case of a failure.Certain changes in the system (unavailable resource/ change of bucket
          policy etc.) cause an object to require a rebuilding process in order to stay resilient.
        </DashboardCardHelp>
      </DashboardCardHeader>
      <DashboardCardBody
        className="nb-data-resiliency__dashboard-body"
        isLoading={!error && !rebuildProgressQueryResult}
      >
        {formattedRebuildProgress >= 100 || !rebuildProgress ? (
          <DataResiliencyStatusBody isResilient={!error && formattedRebuildProgress} />
        ) : (
          <DataResiliencyBuildBody
            progressPercentage={formattedRebuildProgress}
            eta={formattedEta}
          />
        )}
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(DataResiliency);

type DataResiliencyBuildBody = {
  progressPercentage: number;
  eta: string;
};

type DataResiliencyStatusBody = {
  isResilient: number;
};
