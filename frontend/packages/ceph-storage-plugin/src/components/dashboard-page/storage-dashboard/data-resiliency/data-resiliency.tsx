import * as React from 'react';
import * as _ from 'lodash';
import { Progress } from '@patternfly/react-core';

import './data-resiliency.scss';

import { DashboardCard } from '@console/internal/components/dashboard/dashboard-card/card';
import { DashboardCardBody } from '@console/internal/components/dashboard/dashboard-card/card-body';
import { DashboardCardHeader } from '@console/internal/components/dashboard/dashboard-card/card-header';
import { DashboardCardTitle } from '@console/internal/components/dashboard/dashboard-card/card-title';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
} from '@console/internal/components/utils/status-icon';

import { DATA_RESILIENCY_QUERIES } from '../../../../constants/queries';

const getCapacityStats = (response) => {
  return _.get(response, 'data.result[0].value[1]');
};

const DataResiliencyStatusBody: React.FC<DataResiliencyStatusBody> = ({ isResilient }) =>
  isResilient ? (
    <>
      <div className="ceph-data-resiliency__status-title-ok">Your data is resilient</div>
      <div className="ceph-data-resiliency__icon-ok">
        <GreenCheckCircleIcon />
      </div>
    </>
  ) : (
    <>
      <div className="ceph-data-resiliency__icon-error">
        <RedExclamationCircleIcon />
      </div>
      <div className="ceph-data-resiliency__status-title-error">No data available</div>
    </>
  );

const DataResiliencyBuildBody: React.FC<DataResiliencyBuildBody> = ({ progressPercentage }) => (
  <>
    <div className="ceph-data-resiliency__title">Rebuilding data resiliency</div>
    <Progress
      className="ceph-data-resiliency__utilization-bar"
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
    'result',
  ]);
  const totalPGRaw = prometheusResults.getIn([
    DATA_RESILIENCY_QUERIES.CEPH_PG_TOTAL_QUERY,
    'result',
  ]);

  const totalPg = getCapacityStats(totalPGRaw);
  const cleanAndActivePg = getCapacityStats(cleanAndActivePGRaw);

  let progressPercentage;
  if (totalPg && cleanAndActivePg) {
    progressPercentage = ((Number(cleanAndActivePg) / Number(totalPg)) * 100).toFixed(1);
  }
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Data Resiliency</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody
        className="ceph-data-resiliency__dashboard-body"
        isLoading={!(totalPGRaw && cleanAndActivePGRaw)}
      >
        {progressPercentage >= 100 || !progressPercentage ? (
          <DataResiliencyStatusBody isResilient={progressPercentage} />
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
  isResilient: number;
};
