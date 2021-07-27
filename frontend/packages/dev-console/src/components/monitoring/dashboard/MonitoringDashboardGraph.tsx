import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import { QueryBrowser } from '@console/internal/components/monitoring/query-browser';
import { Humanize } from '@console/internal/components/utils';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import './MonitoringDashboardGraph.scss';

export enum GraphTypes {
  area = 'Area',
  line = 'Line',
}

const PrometheusGraphLink = ({ query, namespace, ariaChartLinkLabel }) => {
  const { t } = useTranslation();
  const queries = _.compact(_.castArray(query));
  if (!queries.length) {
    return null;
  }
  const params = new URLSearchParams();
  queries.forEach((q, index) => params.set(`query${index}`, q));
  return (
    <DashboardCardLink
      aria-label={ariaChartLinkLabel}
      to={`/dev-monitoring/ns/${namespace}/metrics?${params.toString()}`}
    >
      {t('devconsole~Inspect')}
    </DashboardCardLink>
  );
};

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
        <PrometheusGraphLink
          namespace={namespace}
          query={query}
          ariaChartLinkLabel={t('devconsole~View metrics for {{title}}', {
            title,
          })}
        />
      </DashboardCardHeader>
      <DashboardCardBody>
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
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default MonitoringDashboardGraph;
