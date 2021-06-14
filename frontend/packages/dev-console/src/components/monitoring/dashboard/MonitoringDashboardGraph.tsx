import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PrometheusGraphLink } from '@console/internal/components/graphs/prometheus-graph';
import { QueryBrowser } from '@console/internal/components/monitoring/query-browser';
import { Humanize } from '@console/internal/components/utils';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import './MonitoringDashboardGraph.scss';

export enum GraphTypes {
  area = 'Area',
  line = 'Line',
}

type MonitoringDashboardGraphProps = {
  title: string;
  query: string;
  namespace: string;
  graphType?: GraphTypes;
  humanize: Humanize;
  byteDataType: ByteDataTypes;
  timespan?: number;
  pollInterval?: number;
};

const DEFAULT_TIME_SPAN = 30 * 60 * 1000;
const DEFAULT_SAMPLES = 30;

export const MonitoringDashboardGraph: React.FC<MonitoringDashboardGraphProps> = ({
  query,
  namespace,
  title,
  graphType = GraphTypes.area,
  timespan,
  pollInterval,
}) => {
  const { t } = useTranslation();
  return (
    <DashboardCard className="monitoring-dashboards__card odc-monitoring-dashboard-graph">
      <DashboardCardHeader>
        <DashboardCardTitle>{title}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <PrometheusGraphLink
          query={query}
          ariaChartLinkLabel={t('devconsole~View metrics for {{title}}', {
            title,
          })}
        >
          <QueryBrowser
            hideControls
            defaultTimespan={DEFAULT_TIME_SPAN}
            defaultSamples={DEFAULT_SAMPLES}
            namespace={namespace}
            queries={[query]}
            isStack={graphType === GraphTypes.area}
            timespan={timespan}
            pollInterval={pollInterval}
            formatSeriesTitle={(labels) => labels.pod}
            showLegend
          />
        </PrometheusGraphLink>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default MonitoringDashboardGraph;
