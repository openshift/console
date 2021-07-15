import * as _ from 'lodash-es';
import i18n from 'i18next';
import { chart_color_orange_300 as requestedColor } from '@patternfly/react-tokens/dist/js/chart_color_orange_300';

import { PrometheusResponse, DataPoint, PrometheusResult } from '.';
import { Humanize } from '../utils';

export const defaultXMutator: XMutator = (x) => new Date(x * 1000);
export const defaultYMutator: YMutator = (y) => parseFloat(y);

export const getRangeVectorStats: GetRangeStats = (
  response,
  description,
  symbol,
  xMutator,
  yMutator,
) => {
  const results = response?.data?.result;
  return results?.map((r, index) => {
    return r?.values?.map(([x, y]) => {
      return {
        x: xMutator?.(x) ?? defaultXMutator(x),
        y: yMutator?.(y) ?? defaultYMutator(y),
        description: _.isFunction(description) ? description(r, index) : description,
        symbol,
      } as DataPoint<Date>;
    });
  });
};

export const getInstantVectorStats: GetInstantStats = (response, metric, humanize) => {
  const results = _.get(response, 'data.result', []);
  return results.map((r) => {
    const y = parseFloat(_.get(r, 'value[1]'));
    return {
      label: humanize ? humanize(y).string : null,
      x: _.get(r, ['metric', metric], ''),
      y,
      metric: r.metric,
    };
  });
};

export const mapLimitsRequests = (
  utilization: PrometheusResponse,
  limit: PrometheusResponse,
  requested: PrometheusResponse,
  xMutator?: XMutator,
): { data: DataPoint[][]; chartStyle: object[] } => {
  const utilizationData = getRangeVectorStats(utilization, 'usage', null, xMutator);
  const data = utilizationData ? [...utilizationData] : [];
  const chartStyle = [null];
  if (limit) {
    const limitData = getRangeVectorStats(
      limit,
      i18n.t('public~total limit'),
      { type: 'dash' },
      xMutator,
    );
    data.push(...limitData);
    if (limitData.length) {
      chartStyle.push({
        data: { strokeDasharray: '3,3', fillOpacity: 0 },
      });
    }
  }
  if (requested) {
    const reqData = getRangeVectorStats(
      requested,
      i18n.t('public~total requested'),
      {
        type: 'dash',
        fill: requestedColor.value,
      },
      xMutator,
    );
    data.push(...reqData);
    if (reqData.length) {
      chartStyle.push({
        data: { stroke: requestedColor.value, strokeDasharray: '3,3', fillOpacity: 0 },
      });
    }
  }

  return { data, chartStyle };
};

type XMutator = (x: any) => Date;
type YMutator = (y: any) => number;

export type GetRangeStats = (
  response: PrometheusResponse,
  description?: string | ((result: PrometheusResult, index: number) => string),
  symbol?: { fill?: string; type?: string },
  xMutator?: XMutator,
  yMutator?: YMutator,
) => DataPoint<Date>[][];

export type GetInstantStats = (
  response: PrometheusResponse,
  metric?: string,
  humanize?: Humanize,
) => DataPoint<number>[];
