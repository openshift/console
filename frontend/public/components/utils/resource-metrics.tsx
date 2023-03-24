import * as React from 'react';
import { useTranslation } from 'react-i18next';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import { Grid, GridItem, Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';

import { QueryBrowser } from '../monitoring/query-browser';
import {
  ResourceUtilizationQuery,
  useResourceMetricsQueries,
} from '@console/shared/src/promql/resource-metrics';
import { K8sResourceKind } from '@console/internal/module/k8s';

const ResourceMetricsDashboardCard: React.FC<ResourceMetricsDashboardCardProps> = (props) => (
  <Card className="resource-metrics-dashboard__card">
    <CardHeader>
      <CardTitle>{props.title}</CardTitle>
    </CardHeader>
    <CardBody className="resource-metrics-dashboard__card-body">
      <QueryBrowser queries={props.queries} namespace={props.namespace} disableZoom hideControls />
    </CardBody>
  </Card>
);

export const ResourceMetricsDashboard: React.FC<ResourceMetricsDashboardProps> = ({ obj }) => {
  const { t } = useTranslation();
  const queries = useResourceMetricsQueries(obj);
  return queries ? (
    <Dashboard className="resource-metrics-dashboard">
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
