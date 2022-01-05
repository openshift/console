import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DataPoint } from '@console/internal/components/graphs';
import { Humanize } from '@console/internal/components/utils';
import { AreaChart } from './area-chart';

export const MultilineUtilizationItem: React.FC<MultilineUtilizationItemProps> = React.memo(
  ({ title, data, humanizeValue, isLoading = false, queries, error, chartType }) => {
    const { t } = useTranslation();
    const currentValue =
      data.length > 1 && data[0].length && data[1].length
        ? humanizeValue(data[0][data[0].length - 1].y + data[1][data[1].length - 1].y).string
        : '';
    const chart = (
      <AreaChart
        data={error ? [[]] : data}
        loading={!error && isLoading}
        query={queries.map((q) => q.query)}
        humanize={humanizeValue}
        ariaChartLinkLabel={t('console-shared~View {{title}} metrics in query browser', {
          title,
        })}
        ariaChartTitle={title}
        chartType={chartType}
      />
    );

    return (
      <div className="co-utilization-card__item-ceph" data-test-id="utilization-item">
        <div className="co-utilization-card__item-description-ceph">
          <div className="co-utilization-card__item-section-multiline">
            <h4 className="pf-c-title pf-m-lg">{title}</h4>
            {error || (!isLoading && !(data.length && data.every((datum) => datum.length))) ? (
              <div className="text-secondary">{t('console-shared~Not available')}</div>
            ) : (
              <div className="co-utilization-card__item-description-ceph-sub">{currentValue}</div>
            )}
          </div>
        </div>
        <div className="co-utilization-card__item-chart">{chart}</div>
        <hr style={{ border: '1px lightgray solid', margin: '0px' }} />
      </div>
    );
  },
);

type QueryWithDescription = {
  query: string;
  desc: string;
};

type MultilineUtilizationItemProps = {
  title: string;
  data?: DataPoint[][];
  isLoading: boolean;
  humanizeValue: Humanize;
  queries: QueryWithDescription[];
  error: boolean;
  chartType?: 'stacked-area' | 'grouped-line';
};
