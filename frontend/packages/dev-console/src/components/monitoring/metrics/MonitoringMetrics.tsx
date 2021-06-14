import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import ConnectedMetricsChart from './MetricsChart';
import MetricsQueryInput from './MetricsQueryInput';

export const MonitoringMetrics: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('devconsole~Metrics')}</title>
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
};

export default MonitoringMetrics;
