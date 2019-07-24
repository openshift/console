import * as React from 'react';
import * as _ from 'lodash-es';

import { LoadingInline, Humanize } from '../../utils';
import { GaugeChart } from '../../graphs/gauge';

const NOT_AVAILABLE = 'Not available';

export const CapacityItem: React.FC<CapacityItemProps> = React.memo(({ title, used, total, formatValue, isLoading = false }) => {
  const error = (!_.isFinite(used) || !_.isFinite(total)) ? 'No Data' : '';
  const totalFormatted = formatValue(total || 0);
  const usedFormatted = formatValue(used || 0, null, totalFormatted.unit);
  const available = formatValue(totalFormatted.value - usedFormatted.value, totalFormatted.unit, totalFormatted.unit);
  const percentageUsed = total > 0 ? Math.round((100 * usedFormatted.value) / totalFormatted.value) : 0;
  const data = {
    x: usedFormatted.string,
    y: percentageUsed,
  };
  const description = error ? NOT_AVAILABLE : (
    <>
      <span className="co-capacity-card__item-description-value">{available.string}</span>
      {' available out of '}
      <span className="co-capacity-card__item-description-value">{totalFormatted.string}</span>
    </>
  );
  return (
    <div className="co-capacity-card__item">
      <div className="co-capacity-card__item-title">{title}</div>
      <h6 className="co-capacity-card__item-description">{isLoading ? <LoadingInline /> : description}</h6>
      <GaugeChart
        data={data}
        label={`${percentageUsed.toString()}%`}
        loading={isLoading}
        error={error}
      />
    </div>
  );
});

type CapacityItemProps = {
  title: string;
  used?: React.ReactText;
  total?: React.ReactText;
  formatValue: Humanize,
  isLoading: boolean;
};
