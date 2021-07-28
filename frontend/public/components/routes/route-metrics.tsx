import * as React from 'react';
import { FLAGS } from '@console/shared/src/constants';
import { Area } from '@console/internal/components/graphs/area';
import { humanizeDecimalBytesPerSec } from '@console/internal/components/utils';
import { connectToFlags, WithFlagsProps } from '../../reducers/connectToFlags';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Grid, GridItem } from '@patternfly/react-core';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';

// TODO Update to use QueryBrowser for each graph
export const RouteMetrics = connectToFlags<RouteMetricsProps>(FLAGS.CAN_GET_NS)(
  ({ obj, flags }: RouteMetricsProps) => {
    const { t } = useTranslation();
    if (!flags[FLAGS.CAN_GET_NS]) {
      return null;
    }
    const namespaceRouteQuery = `{exported_namespace="${obj.metadata.namespace}",route="${obj.metadata.name}"}[5m]`;
    return (
      <Dashboard>
        <Grid hasGutter>
          <GridItem xl={6} lg={12}>
            <DashboardCard>
              <DashboardCardHeader>
                <DashboardCardTitle>{t('public~Traffic in')}</DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardBody>
                <Area
                  humanize={humanizeDecimalBytesPerSec}
                  query={`sum without (instance,exported_pod,exported_service,pod,server) (irate(haproxy_server_bytes_in_total${namespaceRouteQuery}))`}
                />
              </DashboardCardBody>
            </DashboardCard>
          </GridItem>
          <GridItem xl={6} lg={12}>
            <DashboardCard>
              <DashboardCardHeader>
                <DashboardCardTitle>{t('public~Traffic out')}</DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardBody>
                <Area
                  humanize={humanizeDecimalBytesPerSec}
                  query={`sum without (instance,exported_pod,exported_service,pod,server) (irate(haproxy_server_bytes_out_total${namespaceRouteQuery}))`}
                />
              </DashboardCardBody>
            </DashboardCard>
          </GridItem>
          <GridItem xl={6} lg={12}>
            <DashboardCard>
              <DashboardCardHeader>
                <DashboardCardTitle>{t('public~Connection rate')}</DashboardCardTitle>
              </DashboardCardHeader>
              <DashboardCardBody>
                <Area
                  query={`sum without (instance,exported_pod,exported_service,pod,server) (irate(haproxy_backend_connections_total${namespaceRouteQuery}))`}
                />
              </DashboardCardBody>
            </DashboardCard>
          </GridItem>
        </Grid>
      </Dashboard>
    );
  },
);

export type RouteMetricsProps = {
  obj: K8sResourceKind;
} & WithFlagsProps;
