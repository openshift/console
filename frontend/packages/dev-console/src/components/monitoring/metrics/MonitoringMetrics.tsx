import * as React from 'react';
import ConnectedMetricsChart from './MetricsChart';
import MetricsQueryInput from './MetricsQueryInput';

export const MonitoringMetrics: React.FC = () => {
  return (
    <div className="co-m-pane__body">
      <MetricsQueryInput />
      <div className="row">
        <div className="col-xs-12">
          <ConnectedMetricsChart />
        </div>
      </div>
    </div>
  );
};

export default MonitoringMetrics;
