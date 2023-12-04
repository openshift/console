import * as React from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch } from 'react-redux';
import { BrowserRouter, Link } from 'react-router-dom-v5-compat';
import { dashboardsSetEndTime, dashboardsSetTimespan } from '@console/internal/actions/observe';
import { Humanize } from '@console/internal/components/utils';
import { QueryBrowser } from '@console/shared/src/components/query-browser';
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
      isClickable
      isSelectable
    >
      <CardHeader
        actions={{
          actions: (
            <BrowserRouter>
              <PrometheusGraphLink
                namespace={namespace}
                query={query}
                ariaChartLinkLabel={t('devconsole~View metrics for {{title}}', {
                  title,
                })}
              />
            </BrowserRouter>
          ),
          hasNoOffset: false,
          className: 'co-overview-card__actions',
        }}
      >
        <CardTitle>{title}</CardTitle>
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
