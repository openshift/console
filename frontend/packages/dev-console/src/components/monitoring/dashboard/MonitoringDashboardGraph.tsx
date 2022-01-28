import * as React from 'react';
import { Card, CardBody, CardHeader, CardTitle, CardActions } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { dashboardsSetEndTime, dashboardsSetTimespan } from '@console/internal/actions/observe';
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
    <Link
      aria-label={ariaChartLinkLabel}
      to={`/dev-monitoring/ns/${namespace}/metrics?${params.toString()}`}
    >
      {t('devconsole~Inspect')}
    </Link>
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
  const dispatch = useDispatch();
  const onZoom = React.useCallback(
    (from, to) => {
      dispatch(dashboardsSetEndTime(to, 'dev'));
      dispatch(dashboardsSetTimespan(to - from, 'dev'));
    },
    [dispatch],
  );
  return (
    <Card
      className="monitoring-dashboards__card odc-monitoring-dashboard-graph"
      data-test={title.toLowerCase().replace(/\s+/g, '-')}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardActions className="co-overview-card__actions">
          <PrometheusGraphLink
            namespace={namespace}
            query={query}
            ariaChartLinkLabel={t('devconsole~View metrics for {{title}}', {
              title,
            })}
          />
        </CardActions>
      </CardHeader>
      <CardBody>
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
          onZoom={onZoom}
          showLegend
        />
      </CardBody>
    </Card>
  );
};

export default MonitoringDashboardGraph;
