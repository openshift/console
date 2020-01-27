import * as React from 'react';
import * as _ from 'lodash';
import { match as RMatch } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Grid, GridItem } from '@patternfly/react-core';
import { getURLSearchParams } from '@console/internal/components/utils';
import MonitoringDashboardGraph from './MonitoringDashboardGraph';
import {
  monitoringDashboardQueries,
  workloadMetricsQueries,
  MonitoringQuery,
  topWorkloadMetricsQueries,
} from '../queries';
import MonitoringDasboardPodCount from './MonitoringDashboardPodCount';

interface MonitoringDashboardProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ match }) => {
  const namespace = match.params.ns;
  const params = getURLSearchParams();
  const { workloadName, workloadType } = params;
  const queries: MonitoringQuery[] =
    workloadName && workloadType
      ? [...topWorkloadMetricsQueries, ...workloadMetricsQueries]
      : monitoringDashboardQueries;

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      <Grid className="co-m-pane__body" gutter="md">
        <GridItem span={3} rowSpan={1}>
          <MonitoringDasboardPodCount namespace={namespace} />
        </GridItem>
        {_.map(queries, (q, i) => (
          <GridItem span={i === 0 ? 5 : 4} key={q.title}>
            <MonitoringDashboardGraph
              title={q.title}
              namespace={namespace}
              graphType={q.chartType}
              query={q.query({ namespace, workloadName, workloadType })}
              humanize={q.humanize}
              byteDataType={q.byteDataType}
            />
          </GridItem>
        ))}
      </Grid>
    </>
  );
};

export default MonitoringDashboard;
