import * as _ from 'lodash-es';
import { chart_color_orange_300 as requestedColor } from '@patternfly/react-tokens';

import { PrometheusResponse, DataPoint, PrometheusResult } from '.';
import { Humanize } from '../utils';

export const getRangeVectorStats: GetRangeStats = (response, description, symbol) => {
  const results = response?.data?.result;
  return results?.map((r, index) => {
    return r?.values?.map((value) => {
      const x = new Date(value[0] * 1000);
      x.setSeconds(0, 0);
      return {
        x,
        y: parseFloat(value[1]),
        description: _.isFunction(description) ? description(r, index) : description,
        symbol,
      };
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
): { data: DataPoint[][]; chartStyle: object[] } => {
  const utilizationData = getRangeVectorStats(utilization, 'usage');
  const data = utilizationData ? [...utilizationData] : [];
  const chartStyle = [null];
  if (limit) {
    const limitData = getRangeVectorStats(limit, 'total limit', { type: 'dash' });
    data.push(...limitData);
    if (limitData.length) {
      chartStyle.push({
        data: { strokeDasharray: '3,3', fillOpacity: 0 },
      });
    }
  }
  if (requested) {
    const reqData = getRangeVectorStats(requested, 'total requested', {
      type: 'dash',
      fill: requestedColor.value,
    });
    data.push(...reqData);
    if (reqData.length) {
      chartStyle.push({
        data: { stroke: requestedColor.value, strokeDasharray: '3,3', fillOpacity: 0 },
      });
    }
  }

  return {
    data,
    chartStyle,
  };
};

export type GetRangeStats = (
  response: PrometheusResponse,
  description?: string | ((result: PrometheusResult, index: number) => string),
  symbol?: { fill?: string; type?: string },
) => DataPoint<Date>[][];

export type GetInstantStats = (
  response: PrometheusResponse,
  metric?: string,
  humanize?: Humanize,
) => DataPoint<number>[];
