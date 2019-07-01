import * as React from 'react';

import { LOADING, CAPACITY, NOT_AVAILABLE } from './strings';
import { LoadingInline, Humanize } from '../../utils';
import { GaugeChart } from '../../graphs/gauge';

export const CapacityItem: React.FC<CapacityItemProps> = React.memo(({ title, used, total, formatValue, isLoading = false }) => {
  let description;
  let data = { x: null, y: 0 };
  let primaryTitle;
  let secondaryTitle;
  let error = false;
  if (isLoading) {
    description = <LoadingInline />;
    primaryTitle = LOADING;
    secondaryTitle = CAPACITY;
  } else if (used == null || total == null) {
    description = NOT_AVAILABLE;
    error = true;
  } else {
    const totalFormatted = formatValue(total);
    const usedFormatted = formatValue(used, null, totalFormatted.unit);

    const available = formatValue(totalFormatted.value - usedFormatted.value, totalFormatted.unit, totalFormatted.unit);
    const percentageUsed = total > 0 ? Math.round((100 * usedFormatted.value) / totalFormatted.value) : 0;

    data = {
      x: usedFormatted.string,
      y: percentageUsed,
    };
    description = (
      <>
        <span className="co-capacity-card__item-description-value">{available.string}</span>
        {' available out of '}
        <span className="co-capacity-card__item-description-value">{totalFormatted.string}</span>
      </>
    );
    primaryTitle = `${percentageUsed.toString()}%`;
  }
  return (
    <div className="co-capacity-card__item">
      <div className="co-capacity-card__item-title">{title}</div>
      <h6 className="co-capacity-card__item-description">{description}</h6>
      <GaugeChart
        data={data}
        label={primaryTitle}
        secondaryTitle={secondaryTitle}
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
