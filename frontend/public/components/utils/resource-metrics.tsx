import * as React from 'react';
import { useTranslation } from 'react-i18next';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import { Grid, GridItem } from '@patternfly/react-core';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import { QueryBrowser } from '../monitoring/query-browser';
import {
  ResourceUtilizationQuery,
  useResourceMetricsQueries,
} from '@console/shared/src/promql/resource-metrics';
import { K8sResourceKind } from '@console/internal/module/k8s';

const ResourceMetricsDashboardCard: React.FC<ResourceMetricsDashboardCardProps> = (props) => (
  <DashboardCard>
    <DashboardCardHeader>
      <DashboardCardTitle>{props.title}</DashboardCardTitle>
    </DashboardCardHeader>
    <DashboardCardBody>
      <QueryBrowser
        queries={props.queries}
        disableZoom
        hideControls
        showLegend
        wrapperClassName="query-browser__resource-metrics-wrapper"
      />
    </DashboardCardBody>
  </DashboardCard>
);

export const ResourceMetricsDashboard: React.FC<ResourceMetricsDashboardProps> = ({ obj }) => {
  const { t } = useTranslation();
  const queries = useResourceMetricsQueries(obj);
  return queries ? (
    <Dashboard>
      <Grid hasGutter>
        <GridItem xl={6} lg={12}>
          <ResourceMetricsDashboardCard
            title={t('public~Memory usage')}
            queries={queries[ResourceUtilizationQuery.MEMORY]}
          />
        </GridItem>
        <GridItem xl={6} lg={12}>
          <ResourceMetricsDashboardCard
            title={t('public~CPU usage')}
            queries={queries[ResourceUtilizationQuery.CPU]}
          />
        </GridItem>
        <GridItem xl={6} lg={12}>
          <ResourceMetricsDashboardCard
            title={t('public~Filesystem')}
            queries={queries[ResourceUtilizationQuery.FILESYSTEM]}
          />
        </GridItem>
        <GridItem xl={6} lg={12}>
          <ResourceMetricsDashboardCard
            title={t('public~Network in')}
            queries={queries[ResourceUtilizationQuery.NETWORK_IN]}
          />
        </GridItem>
        <GridItem xl={6} lg={12}>
          <ResourceMetricsDashboardCard
            title={t('public~Network out')}
            queries={queries[ResourceUtilizationQuery.NETWORK_OUT]}
          />
        </GridItem>
      </Grid>
    </Dashboard>
  ) : null;
};

type ResourceMetricsDashboardCardProps = {
  title: string;
  queries: string[];
};

type ResourceMetricsDashboardProps = {
  obj: K8sResourceKind;
};
