import * as React from 'react';
import { connect } from 'react-redux';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import { QueryBrowser, QueryObj } from '@console/internal/components/monitoring/query-browser';
import { Humanize } from '@console/internal/components/utils';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { PrometheusGraphLink } from '@console/internal/components/graphs/prometheus-graph';
import { queryBrowserPatchQuery } from '@console/internal/actions/ui';
import './MonitoringDashboardGraph.scss';

export enum GraphTypes {
  area = 'Area',
  line = 'Line',
}

type DispatchProps = {
  patchQuery: (patch: QueryObj) => void;
};

type OwnProps = {
  title: string;
  query: string;
  namespace: string;
  graphType?: GraphTypes;
  humanize: Humanize;
  byteDataType: ByteDataTypes;
  timespan?: number;
  pollInterval?: number;
};

type MonitoringDashboardGraphProps = OwnProps & DispatchProps;

const DEFAULT_TIME_SPAN = 30 * 60 * 1000;
const DEFAULT_SAMPLES = 30;

export const MonitoringDashboardGraph: React.FC<MonitoringDashboardGraphProps> = ({
  query,
  namespace,
  title,
  patchQuery,
  graphType = GraphTypes.area,
  timespan,
  pollInterval,
}) => {
  return (
    <DashboardCard className="monitoring-dashboards__card odc-monitoring-dashboard-graph">
      <DashboardCardHeader>
        <DashboardCardTitle>{title}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <PrometheusGraphLink query={query}>
          <div onMouseEnter={() => patchQuery({ query })}>
            <QueryBrowser
              hideControls
              defaultTimespan={DEFAULT_TIME_SPAN}
              defaultSamples={DEFAULT_SAMPLES}
              namespace={namespace}
              queries={[query]}
              isStack={graphType === GraphTypes.area}
              timespan={timespan}
              pollInterval={pollInterval}
              formatLegendLabel={(labels) => labels.pod}
            />
          </div>
        </PrometheusGraphLink>
      </DashboardCardBody>
    </DashboardCard>
  );
};

const mapDispatchToProps = (dispatch): DispatchProps => ({
  patchQuery: (v: QueryObj) => dispatch(queryBrowserPatchQuery(0, v)),
});

export default connect<{}, DispatchProps, OwnProps>(
  null,
  mapDispatchToProps,
)(MonitoringDashboardGraph);
