import * as _ from 'lodash';
import * as moment from 'moment';
import { TFunction } from 'i18next';
import { humanizeNumberSI } from '@console/internal/components/utils';
import { PrometheusResponse, PrometheusResult } from '@console/internal/components/graphs';
import { parsePrometheusDuration } from '@console/internal/components/utils/datetime';
import { PipelineKind } from '../../../types';

export interface GraphData {
  chartName: string;
  hasData: boolean;
}
export interface PipelineMetricsGraphProps {
  pipeline: PipelineKind;
  timespan: number;
  interval: number;
  width?: number;

  loaded?: boolean;
  onLoad?: (g: GraphData) => void;
}
export enum PipelineQuery {
  NUMBER_OF_PIPELINE_RUNS = 'NUMBER_OF_PIPELINE_RUNS',
  PIPELINE_RUN_DURATION = 'PIPELINE_RUN_DURATION',
  PIPELINE_RUN_TASK_RUN_DURATION = 'PIPELINE_RUN_TASK_RUN_DURATION',
  PIPELINE_SUCCESS_RATIO = 'PIPELINE_SUCCESS_RATIO',
}
export const metricQueries = {
  [PipelineQuery.NUMBER_OF_PIPELINE_RUNS]: _.template(
    `sum(count by (pipelinerun) (tekton_pipelinerun_duration_seconds_count{pipeline="<%= name %>",exported_namespace="<%= namespace %>"}))`,
  ),
  [PipelineQuery.PIPELINE_RUN_TASK_RUN_DURATION]: _.template(
    `sum(tekton_pipelinerun_taskrun_duration_seconds_sum{pipeline="<%= name %>",exported_namespace="<%= namespace %>"})  by (pipelinerun, task)`,
  ),
  [PipelineQuery.PIPELINE_RUN_DURATION]: _.template(
    `sum(tekton_pipelinerun_duration_seconds_sum{pipeline="<%= name %>",exported_namespace="<%= namespace %>"})  by (pipelinerun)`,
  ),
  [PipelineQuery.PIPELINE_SUCCESS_RATIO]: _.template(
    `count(sort_desc(tekton_pipelinerun_duration_seconds_count{pipeline="<%= name %>",exported_namespace="<%= namespace %>"})) by (status)`,
  ),
};

const formatPositiveValue = (v: number): string =>
  v === 0 || (v >= 0.001 && v < 1e23) ? humanizeNumberSI(v).string : v.toExponential(1);
export const formatValue = (v: number): string =>
  (v < 0 ? '-' : '') + formatPositiveValue(Math.abs(v));
export const formatDate = (date: Date) => {
  return `${moment(date).format('MMM DD')}`;
};
export const formatTimeSeriesValues = (result: PrometheusResult, samples: number, span: number) => {
  const { metric, values } = result;
  const newValues = _.map(values, (v) => {
    const y = Number(v[1]);
    return {
      x: new Date(new Date(v[0] * 1000).setHours(0, 0, 0, 0)),
      y: Number.isNaN(y) ? null : y,
      metric,
    };
  });

  // The data may have missing values, so we fill those gaps with nulls so that the graph correctly
  // shows the missing values as gaps in the line
  const start = Number(_.get(newValues, '[0].x'));
  const end = Number(_.get(_.last(newValues), 'x'));
  const step = span / samples;
  _.range(start, end, step).forEach((t, i) => {
    const x = new Date(t);
    if (_.get(newValues, [i, 'x']) > x) {
      newValues.splice(i, 0, { x, y: null, metric });
    }
  });

  return newValues;
};

type XMutator = (x: any) => Date | string;
type YMutator = (y: any) => number;
export const getRangeVectorData = (
  response: PrometheusResponse,
  xMutator: XMutator,
  yMutator?: YMutator,
) => {
  const results = response?.data?.result || [];
  return results?.map((r) => {
    return r?.values?.map(([x, y]) => {
      return {
        x: xMutator?.(r) ?? new Date(x * 1000),
        y: yMutator?.(y) ?? parseFloat(y),
        metric: r?.metric,
        time: x,
      };
    });
  });
};

export const getXaxisValues = (timespan: number): number[] => {
  const xValues = [];
  if (!timespan) return xValues;
  const oneDayDuration = parsePrometheusDuration('1d');
  const endDate = new Date(Date.now()).setHours(0, 0, 0, 0);
  const numDays = Math.round(timespan / oneDayDuration);
  for (let m = moment(endDate); xValues.length - 1 < numDays; m.subtract(1, 'days')) {
    xValues.push(m.unix() * 1000);
  }
  return xValues.slice(0, numDays);
};

export const getYaxisValues = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
};
export const PipelineMetricsTimeRangeOptions = (t: TFunction) => ({
  '1d': t('pipelines-plugin~1 day'),
  '3d': t('pipelines-plugin~3 days'),
  '1w': t('pipelines-plugin~1 week'),
  '2w': t('pipelines-plugin~2 weeks'),
  '3w': t('pipelines-plugin~3 weeks'),
  '4w': t('pipelines-plugin~4 weeks'),
});
