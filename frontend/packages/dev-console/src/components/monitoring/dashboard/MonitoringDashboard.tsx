import * as React from 'react';
import * as _ from 'lodash';
import { match as RMatch } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Grid, GridItem } from '@patternfly/react-core';
import MonitoringDashboardGraph from './MonitoringDashboardGraph';
import { queries } from './monitoringDashboardQueries';
import MonitoringDasboardCountBlock from './MonitoringDashboardCountBlock';

interface MonitoringDashboardProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ match }) => {
  const namespace = match.params.ns;

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      <Grid className="co-m-pane__body" gutter="md">
        <GridItem span={4} rowSpan={1}>
          <MonitoringDasboardCountBlock />
        </GridItem>
        {_.map(queries, (q) => (
          <GridItem span={4} key={q.title}>
            <MonitoringDashboardGraph
              title={q.title}
              namespace={namespace}
              graphType={q.chartType}
              query={q.query({ namespace })}
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
