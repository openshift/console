import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Humanize, TopConsumerPopoverProps, LIMIT_STATE } from '@console/dynamic-plugin-sdk';
import { UtilizationItemProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { ColoredIconProps } from '@console/dynamic-plugin-sdk/src/app/components/status/icons';
import { DataPoint } from '@console/internal/components/graphs';
import {
  AreaChart,
  AreaChartStatus,
  chartStatusColors,
} from '@console/internal/components/graphs/area';
import { mapLimitsRequests } from '@console/internal/components/graphs/utils';
import { ByteDataTypes } from '../../../graph-helper/data-utils';
import { useUtilizationDuration } from '../../../hooks';
import { YellowExclamationTriangleIcon, RedExclamationCircleIcon } from '../../status';

const lastTimeInSeries = (series: DataPoint[]) => new Date(_.last(series)?.x ?? 0).getTime();
const getMaxDate = (data: DataPoint[][]) =>
  new Date(Math.max(...(data?.map?.(lastTimeInSeries) ?? [])) ?? 0);

export const MultilineUtilizationItem: React.FC<MultilineUtilizationItemProps> = React.memo(
  ({
    title,
    data,
    dataUnits,
    humanizeValue,
    isLoading = false,
    queries,
    error,
    TopConsumerPopovers,
    byteDataType,
  }) => {
    const { t } = useTranslation();
    const { endDate, startDate, updateEndDate } = useUtilizationDuration();

    const getCurrentData = (
      description: string,
      originalData?: DataPoint[],
      dataUnitsValue?: string,
    ): string => {
      let current: string;
      if (originalData && originalData.length > 0) {
        const latestData = originalData[originalData.length - 1];
        current = humanizeValue(latestData.y).string;
        if (dataUnitsValue) {
          current += ` ${dataUnitsValue}`;
        }
        if (description === 'in') {
          current = t('console-shared~{{amount}} in', { amount: current });
        } else if (description === 'out') {
          current = t('console-shared~{{amount}} out', { amount: current });
        } else {
          current += ` ${description.toLowerCase()}`;
        }
      }

      return current;
    };

    const current = data.map((datum, index) =>
      getCurrentData(queries[index].desc, datum, dataUnits && dataUnits[index]),
    );
    const maxDate = getMaxDate(data);
    React.useEffect(() => updateEndDate(maxDate), [maxDate, updateEndDate]);

    const mapTranslatedData = (originalData: DataPoint[][]) => {
      if (!originalData || originalData.length === 0 || originalData[0].length === 0)
        return originalData;
      const translatedData = [];

      for (const query of originalData) {
        const currData = [];
        const desc = query[0].description;
        for (const item of query) {
          if (desc === 'in') {
            currData.push({ ...item, description: t('console-shared~in') });
          } else if (desc === 'out') {
            currData.push({ ...item, description: t('console-shared~out') });
          } else {
            currData.push(item);
          }
        }
        translatedData.push(currData);
      }
      return translatedData;
    };

    const translatedData = mapTranslatedData(data);
    const chart = (
      <AreaChart
        data={error ? [[]] : translatedData}
        domain={{ x: [startDate, endDate] }}
        loading={!error && isLoading}
        query={queries.map((q) => q.query)}
        xAxis={false}
        humanize={humanizeValue}
        padding={{ top: 13, left: 70, bottom: 0, right: 0 }}
        height={70}
        byteDataType={byteDataType}
        showAllTooltip
        ariaChartLinkLabel={t('console-shared~View {{title}} metrics in query browser', {
          title,
        })}
        ariaChartTitle={title}
      />
    );

    const currentValue = current.map((curr, index) => {
      const TopConsumerPopover = TopConsumerPopovers && TopConsumerPopovers[index];
      return TopConsumerPopover ? (
        <TopConsumerPopover key={queries[index].desc} current={curr} />
      ) : (
        <div key={queries[index].desc}>{curr}</div>
      );
    });

    return (
      <div className="co-utilization-card__item" data-test-id="utilization-item">
        <div className="co-utilization-card__item-description">
          <div className="co-utilization-card__item-section-multiline">
            <h4 className="pf-c-title pf-m-md" data-test="utilization-item-title">
              {title}
            </h4>
            {error || (!isLoading && !(data.length && data.every((datum) => datum.length))) ? (
              <div className="text-secondary">{t('console-shared~Not available')}</div>
            ) : (
              <div className="co-utilization-card__item-description">{currentValue}</div>
            )}
          </div>
        </div>
        <div className="co-utilization-card__item-chart">{chart}</div>
      </div>
    );
  },
);

// TODO (jon) Fix PrometheusMultilineUtilization so that x-values returned from multiple prometheus
// queries are "synced" on the x-axis (same number of points with the same x-values). In order to do
// so, we have to make sure that the same end time, samples, and duration are used across all
// queries. This is a temporary work around. See https://issues.redhat.com/browse/CONSOLE-2424
export const trimSecondsXMutator = (x) => {
  const d = new Date(x * 1000);
  d.setSeconds(0, 0);
  return d;
};

export const UtilizationItem: React.FC<UtilizationItemProps> = React.memo(
  ({
    title,
    utilization,
    humanizeValue,
    isLoading = false,
    query,
    error,
    max = null,
    TopConsumerPopover,
    byteDataType,
    limit,
    requested,
    setLimitReqState,
  }) => {
    const { t } = useTranslation();
    const { startDate, endDate, updateEndDate } = useUtilizationDuration();
    const { data, chartStyle } = mapLimitsRequests(
      utilization,
      limit,
      requested,
      trimSecondsXMutator,
    );
    const [utilizationData, limitData, requestedData] = data;
    const maxDate = getMaxDate([utilizationData]);
    React.useEffect(() => updateEndDate(maxDate), [updateEndDate, maxDate]);
    const current = utilizationData?.length ? utilizationData[utilizationData.length - 1].y : null;

    let humanMax: string;
    let humanAvailable: string;
    if (max) {
      const currentUtilization = current ?? 0;
      const percentage = (100 * currentUtilization) / max;
      humanMax = humanizeValue(max).string;

      if (percentage >= 90) {
        chartStyle[0] = { data: { fill: chartStatusColors[AreaChartStatus.ERROR] } };
      } else if (percentage >= 80) {
        chartStyle[0] = { data: { fill: chartStatusColors[AreaChartStatus.WARNING] } };
      }

      humanAvailable = humanizeValue(max - currentUtilization).string;
    }

    const chart = (
      <AreaChart
        domain={{ x: [startDate, endDate] }}
        ariaChartLinkLabel={t('console-shared~View {{title}} metrics in query browser', {
          title,
        })}
        ariaChartTitle={title}
        data={data}
        loading={!error && isLoading}
        query={query}
        xAxis={false}
        // Todo(bipuladh): Make huamnize type Humanize once unit.js is converted
        humanize={humanizeValue as Humanize}
        padding={{ top: 13, left: 70, bottom: 0, right: 0 }}
        height={70}
        chartStyle={chartStyle}
        byteDataType={byteDataType}
        mainDataName="usage"
      />
    );

    let LimitIcon: React.ComponentType<ColoredIconProps>;
    let humanLimit: string;
    let limitState = LIMIT_STATE.OK;
    let requestedState = LIMIT_STATE.OK;

    const latestLimit = limitData?.length ? limitData[limitData.length - 1].y : null;
    const latestRequested = requestedData?.length
      ? requestedData[requestedData.length - 1].y
      : null;

    if (max) {
      if (latestLimit && latestRequested) {
        humanLimit = humanizeValue(latestLimit).string;
        const limitPercentage = (100 * latestLimit) / max;
        const reqPercentage = (100 * latestRequested) / max;
        if (limitPercentage > 100) {
          limitState = LIMIT_STATE.ERROR;
        } else if (limitPercentage >= 75) {
          limitState = LIMIT_STATE.WARN;
        }
        if (reqPercentage > 100) {
          requestedState = LIMIT_STATE.ERROR;
        } else if (reqPercentage >= 75) {
          requestedState = LIMIT_STATE.WARN;
        }
        if ([limitState, requestedState].includes(LIMIT_STATE.ERROR)) {
          LimitIcon = RedExclamationCircleIcon;
        } else if ([limitState, requestedState].includes(LIMIT_STATE.WARN)) {
          LimitIcon = YellowExclamationTriangleIcon;
        }
        setLimitReqState && setLimitReqState({ limit: limitState, requested: requestedState });
      }
    }

    const currentHumanized = !_.isNil(current) ? humanizeValue(current).string : null;

    return (
      <div className="co-utilization-card__item" data-test-id="utilization-item">
        <div className="co-utilization-card__item-description">
          <div className="co-utilization-card__item-section">
            <h4 className="pf-c-title pf-m-md" data-test="utilization-item-title">
              {title}
            </h4>
            {error || (!isLoading && !utilizationData?.length) ? (
              <div className="text-secondary">{t('console-shared~Not available')}</div>
            ) : (
              <div>
                {LimitIcon && <LimitIcon className="co-utilization-card__item-icon" />}
                {TopConsumerPopover ? (
                  <TopConsumerPopover
                    current={currentHumanized}
                    limit={!_.isNil(latestLimit) ? humanizeValue(latestLimit).string : null}
                    requested={
                      !_.isNil(latestRequested) ? humanizeValue(latestRequested).string : null
                    }
                    available={humanAvailable}
                    total={humanMax}
                    limitState={limitState}
                    requestedState={requestedState}
                  />
                ) : (
                  currentHumanized
                )}
              </div>
            )}
          </div>
          {!error && (humanAvailable || humanMax) && (
            <div className="co-utilization-card__item-section">
              <span
                className="co-utilization-card__item-text"
                data-test="utilization-card-item-text"
              >
                {humanLimit && (
                  <span>
                    {t(
                      'console-shared~{{humanAvailable}} available of {{humanLimit}} total limit',
                      {
                        humanAvailable,
                        humanLimit,
                      },
                    )}
                  </span>
                )}
                {!humanLimit && humanMax && (
                  <span>
                    {t('console-shared~{{humanAvailable}} available of {{humanMax}}', {
                      humanAvailable,
                      humanMax,
                    })}
                  </span>
                )}
                {!humanLimit && !humanMax && (
                  <span>
                    {t('console-shared~{{humanAvailable}} available', {
                      humanAvailable,
                    })}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
        <div className="co-utilization-card__item-chart">{chart}</div>
      </div>
    );
  },
);

export default UtilizationItem;

export type LimitRequested = {
  limit: LIMIT_STATE;
  requested: LIMIT_STATE;
};

type MultilineUtilizationItemProps = {
  title: string;
  data?: DataPoint[][];
  dataUnits?: string[];
  dataDescription?: string[];
  isLoading: boolean;
  humanizeValue: Humanize;
  queries: QueryWithDescription[];
  error: boolean;
  byteDataType?: ByteDataTypes;
  TopConsumerPopovers?: React.ComponentType<TopConsumerPopoverProps>[];
};

export type QueryWithDescription = {
  query: string;
  desc: string;
};
