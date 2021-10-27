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
        namespace={props.namespace}
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
            namespace={obj.metadata.namespace}
            queries={queries[ResourceUtilizationQuery.MEMORY]}
            title={t('public~Memory usage')}
          />
        </GridItem>
        <GridItem xl={6} lg={12}>
          <ResourceMetricsDashboardCard
            namespace={obj.metadata.namespace}
            queries={queries[ResourceUtilizationQuery.CPU]}
            title={t('public~CPU usage')}
          />
        </GridItem>
        <GridItem xl={6} lg={12}>
          <ResourceMetricsDashboardCard
            namespace={obj.metadata.namespace}
            queries={queries[ResourceUtilizationQuery.FILESYSTEM]}
            title={t('public~Filesystem')}
          />
        </GridItem>
        <GridItem xl={6} lg={12}>
          <ResourceMetricsDashboardCard
            namespace={obj.metadata.namespace}
            queries={queries[ResourceUtilizationQuery.NETWORK_IN]}
            title={t('public~Network in')}
          />
        </GridItem>
        <GridItem xl={6} lg={12}>
          <ResourceMetricsDashboardCard
            namespace={obj.metadata.namespace}
            queries={queries[ResourceUtilizationQuery.NETWORK_OUT]}
            title={t('public~Network out')}
          />
        </GridItem>
      </Grid>
    </Dashboard>
  ) : null;
};

type ResourceMetricsDashboardCardProps = {
  namespace?: string;
  title: string;
  queries: string[];
};

type ResourceMetricsDashboardProps = {
  obj: K8sResourceKind;
};
