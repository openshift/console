import * as React from 'react';
import { Helmet } from 'react-helmet';
import MetricsQueryInput from './MetricsQueryInput';
import ConnectedMetricsChart from './MetricsChart';

export const MonitoringMetrics: React.FC = () => (
  <>
    <Helmet>
      <title>Metrics</title>
    </Helmet>
    <div className="co-m-pane__body">
      <MetricsQueryInput />
      <div className="row">
        <div className="col-xs-12">
          <ConnectedMetricsChart />
        </div>
      </div>
    </div>
  </>
);

export default MonitoringMetrics;
