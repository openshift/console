import * as React from 'react';
import { Helmet } from 'react-helmet';
import ConnectedMetricsQueryInput from './MetricsQueryInput';
import ConnectedMetricsChart from './MetricsChart';

const MonitoringMetrics: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Metrics</title>
      </Helmet>
      <div className="co-m-pane__body">
        <ConnectedMetricsQueryInput />
        <div className="row">
          <div className="col-xs-12">
            <ConnectedMetricsChart />
          </div>
        </div>
      </div>
    </>
  );
};

export default MonitoringMetrics;
