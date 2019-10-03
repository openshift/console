import * as React from 'react';
import * as _ from 'lodash';
import { Humanize } from '@console/internal/components/utils/types';
import { LoadingInline } from '@console/internal/components/utils/status-box';
import { GaugeChart } from '@console/internal/components/graphs/gauge';

const NOT_AVAILABLE = 'Not available';

const CapacityItem: React.FC<CapacityItemProps> = React.memo(
  ({ title, used, total, formatValue, isLoading = false, error }) => {
    const errorMsg = error || !_.isFinite(used) || !_.isFinite(total) ? 'No Data' : '';
    const totalFormatted = formatValue(total || 0);
    const usedFormatted = formatValue(used || 0, null, totalFormatted.unit);
    const available = formatValue(
      totalFormatted.value - usedFormatted.value,
      totalFormatted.unit,
      totalFormatted.unit,
    );
    const percentageUsed =
      total > 0 ? Math.round((100 * usedFormatted.value) / totalFormatted.value) : 0;
    const data = {
      x: usedFormatted.string,
      y: percentageUsed,
    };
    const description = errorMsg ? (
      NOT_AVAILABLE
    ) : (
      <>
        <span className="co-dashboard-text--small co-capacity-card__item-description-value">
          {available.string}
        </span>
        {' available out of '}
        <span className="co-dashboard-text--small co-capacity-card__item-description-value">
          {totalFormatted.string}
        </span>
      </>
    );
    return (
      <div className="co-capacity-card__item">
        <div className="co-capacity-card__item-title">{title}</div>
        <h6 className="co-dashboard-text--small co-capacity-card__item-description">
          {isLoading ? <LoadingInline /> : description}
        </h6>
        <GaugeChart
          className="co-capacity-card__item-chart"
          data={data}
          label={`${percentageUsed.toString()}%`}
          loading={isLoading}
          error={errorMsg}
        />
      </div>
    );
  },
);

export default CapacityItem;

type CapacityItemProps = {
  title: string;
  used?: React.ReactText;
  total?: React.ReactText;
  formatValue: Humanize;
  isLoading: boolean;
  error: boolean;
};
