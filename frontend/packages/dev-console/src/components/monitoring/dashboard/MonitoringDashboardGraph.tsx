import * as React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardTitle';
import { ByteDataTypes } from '@console/dynamic-plugin-sdk/src/shared/graph-helper/data-utils';
import { PrometheusGraphLink } from '@console/internal/components/graphs/prometheus-graph';
import { QueryBrowser } from '@console/internal/components/monitoring/query-browser';
import { Humanize } from '@console/internal/components/utils';
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
  endTime?: number;
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
  endTime,
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
            fixedEndTime={endTime}
            formatSeriesTitle={(labels) => labels.pod}
            showLegend
          />
        </PrometheusGraphLink>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default MonitoringDashboardGraph;
