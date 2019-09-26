import * as React from 'react';
import * as _ from 'lodash';
import { Progress } from '@patternfly/react-core';
import { GreenCheckCircleIcon } from '@console/shared';
import { DashboardCard } from '@console/internal/components/dashboard/dashboard-card/card';
import { DashboardCardBody } from '@console/internal/components/dashboard/dashboard-card/card-body';
import { DashboardCardHeader } from '@console/internal/components/dashboard/dashboard-card/card-header';
import { DashboardCardHelp } from '@console/internal/components/dashboard/dashboard-card';
import { DashboardCardTitle } from '@console/internal/components/dashboard/dashboard-card/card-title';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { DATA_RESILIENCY_QUERIES } from '../../../../constants/queries';
import './data-resiliency.scss';

const getCapacityStats = (response) => {
  return _.get(response, 'data.result[0].value[1]');
};

const DataResiliencyStatusBody: React.FC<DataResiliencyStatusBody> = ({ error }) =>
  !error ? (
    <>
      <div className="ceph-data-resiliency__status-title-ok">Your data is resilient</div>
      <div className="ceph-data-resiliency__icon-ok">
        <GreenCheckCircleIcon />
      </div>
    </>
  ) : (
    <GraphEmpty height="100%" />
  );

const DataResiliencyBuildBody: React.FC<DataResiliencyBuildBody> = ({ progressPercentage }) => (
  <>
    <div className="ceph-data-resiliency__title">Rebuilding data resiliency</div>
    <Progress
      className="ceph-data-resiliency__progress-bar"
      value={progressPercentage}
      title="Rebuilding in Progress"
      label={`${progressPercentage}%`}
    />
  </>
);

const DataResiliency: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  React.useEffect(() => {
    Object.keys(DATA_RESILIENCY_QUERIES).forEach((key) =>
      watchPrometheus(DATA_RESILIENCY_QUERIES[key]),
    );
    return () =>
      Object.keys(DATA_RESILIENCY_QUERIES).forEach((key) =>
        stopWatchPrometheusQuery(DATA_RESILIENCY_QUERIES[key]),
      );
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const cleanAndActivePGRaw = prometheusResults.getIn([
    DATA_RESILIENCY_QUERIES.CEPH_PG_CLEAN_AND_ACTIVE_QUERY,
    'data',
  ]) as PrometheusResponse;
  const cleanAndActivePGRawError = prometheusResults.getIn([
    DATA_RESILIENCY_QUERIES.CEPH_PG_CLEAN_AND_ACTIVE_QUERY,
    'loadError',
  ]);
  const totalPGRaw = prometheusResults.getIn([
    DATA_RESILIENCY_QUERIES.CEPH_PG_TOTAL_QUERY,
    'data',
  ]) as PrometheusResponse;
  const totalPGRawError = prometheusResults.getIn([
    DATA_RESILIENCY_QUERIES.CEPH_PG_TOTAL_QUERY,
    'loadError',
  ]);

  const infoText =
    'Data Resiliency presents status of data replication and rebalancing operations.';
  const totalPg = getCapacityStats(totalPGRaw);
  const cleanAndActivePg = getCapacityStats(cleanAndActivePGRaw);
  const error = cleanAndActivePGRawError || totalPGRawError || !(totalPg && cleanAndActivePg);

  let progressPercentage;
  if (!error) {
    progressPercentage = ((Number(cleanAndActivePg) / Number(totalPg)) * 100).toFixed(1);
    if (!Number.isFinite(Number(progressPercentage))) {
      progressPercentage = 0;
    }
  }
  return (
    <DashboardCard className="ceph-data-resiliency__dashboard-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Data Resiliency</DashboardCardTitle>
        <DashboardCardHelp>{infoText}</DashboardCardHelp>
      </DashboardCardHeader>
      <DashboardCardBody
        className="ceph-data-resiliency__dashboard-body"
        isLoading={!error && !(totalPGRaw && cleanAndActivePGRaw)}
      >
        {progressPercentage >= 100 || !progressPercentage ? (
          <DataResiliencyStatusBody error={error} />
        ) : (
          <DataResiliencyBuildBody progressPercentage={progressPercentage} />
        )}
      </DashboardCardBody>
    </DashboardCard>
  );
};

export const DataResiliencyWithResources = withDashboardResources(DataResiliency);

type DataResiliencyBuildBody = {
  progressPercentage: number;
};

type DataResiliencyStatusBody = {
  error: any;
};
