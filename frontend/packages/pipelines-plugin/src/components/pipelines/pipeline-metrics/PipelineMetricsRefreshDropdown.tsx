import * as React from 'react';
import { useTranslation } from 'react-i18next';
import IntervalDropdown from '@console/internal/components/monitoring/poll-interval-dropdown';

interface PipelineMetricsRefreshDropdownProps {
  interval: number;
  setInterval: (v: number) => void;
}

const PipelineMetricsRefreshDropdown: React.FC<PipelineMetricsRefreshDropdownProps> = ({
  interval,
  setInterval,
}) => {
  const { t } = useTranslation();
  return (
    <div className="form-group">
      <label htmlFor="pipeline-refresh-interval-dropdown">
        {t('pipelines-plugin~Refresh Interval')}
      </label>
      <div>
        <IntervalDropdown
          id="pipeline-refresh-interval-dropdown"
          interval={interval}
          setInterval={setInterval}
        />
      </div>
    </div>
  );
};

export default PipelineMetricsRefreshDropdown;
