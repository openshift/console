import * as React from 'react';
import { global_breakpoint_sm as breakpointSM } from '@patternfly/react-tokens';

import { useRefWidth, Humanize } from '../../utils';
import { DataPoint } from '../../graphs';
import { AreaChart } from '../../graphs/area';

export const UtilizationItem: React.FC<UtilizationItemProps> = React.memo(
  ({ title, data, humanizeValue, isLoading = false, query }) => {
    const [containerRef, width] = useRefWidth();

    let current;
    if (data.length) {
      const latestData = data[data.length - 1];
      current = humanizeValue(latestData.y).string;
    }

    const chart = (
      <AreaChart
        data={data}
        loading={isLoading}
        query={query}
        xAxis={false}
        humanize={humanizeValue}
        padding={{ top: 13, left: 70, bottom: 0, right: 0 }}
        height={80}
        className="co-utilization-card__area-chart"
      />
    );

    const rows = width < parseInt(breakpointSM.value, 10) ? (
      <div className="co-utilization-card__item">
        <div className="row co-utilization-card__item-row--narrow co-utilization-card__item-title-row--narrow">
          <div className="col-xs-6 col-sm-6 col-md-6 col-lg-6 co-utilization-card__item-title co-dashboard-text--small">
            {title}
          </div>
          <div className="col-xs-6 col-sm-6 col-md-6 col-lg-6 co-utilization-card__item-current co-dashboard-text--small">
            {current}
          </div>
        </div>
        <div className="row co-utilization-card__item-row--narrow">
          <div className="co-utilization-card__item-chart co-utilization-card__item-chart--narrow">{chart}</div>
        </div>
      </div>
    ) : (
      <div className="row co-utilization-card__item co-utilization-card__item--wide">
        <div className="col-xs-3 col-sm-3 col-md-3 col-lg-3 co-utilization-card__item-title">
          {title}
        </div>
        <div className="col-xs-2 col-sm-2 col-md-2 col-lg-2 co-utilization-card__item-current">
          {current}
        </div>
        <div className="col-xs-7 col-sm-7 col-md-7 col-lg-7 co-utilization-card__item-chart co-utilization-card__item-chart--wide">
          {chart}
        </div>
      </div>
    );

    return <div ref={containerRef}>{rows}</div>;
  }
);

type UtilizationItemProps = {
  title: string;
  data?: DataPoint[];
  isLoading: boolean,
  humanizeValue: Humanize,
  query: string,
};
