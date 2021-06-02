import i18next from 'i18next';
import * as _ from 'lodash';
import { PrometheusResponse, PrometheusResult } from '@console/internal/components/graphs';
import { humanizeNumberSI } from '@console/internal/components/utils';
import {
  dateFormatterNoYear,
  parsePrometheusDuration,
} from '@console/internal/components/utils/datetime';
import { PipelineKind } from '../../../types';

export interface GraphData {
  chartName: string;
  hasData: boolean;
}
export interface PipelineMetricsGraphProps {
  pipeline: PipelineKind;
  timespan: number;
  queryPrefix: string;
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

export enum MetricsQueryPrefix {
  TEKTON = 'tekton',
  TEKTON_PIPELINES_CONTROLLER = 'tekton_pipelines_controller',
}
export const metricQueries = (prefix: string = MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER) => ({
  [PipelineQuery.NUMBER_OF_PIPELINE_RUNS]: _.template(
    `sum(count by (pipelinerun) (${prefix}_pipelinerun_duration_seconds_count{pipeline="<%= name %>",exported_namespace="<%= namespace %>"}))`,
  ),
  [PipelineQuery.PIPELINE_RUN_TASK_RUN_DURATION]: _.template(
    `sum(${prefix}_pipelinerun_taskrun_duration_seconds_sum{pipeline="<%= name %>",exported_namespace="<%= namespace %>"})  by (pipelinerun, task)`,
  ),
  [PipelineQuery.PIPELINE_RUN_DURATION]: _.template(
    `sum(${prefix}_pipelinerun_duration_seconds_sum{pipeline="<%= name %>",exported_namespace="<%= namespace %>"})  by (pipelinerun)`,
  ),
  [PipelineQuery.PIPELINE_SUCCESS_RATIO]: _.template(
    `count(sort_desc(${prefix}_pipelinerun_duration_seconds_count{pipeline="<%= name %>",exported_namespace="<%= namespace %>"})) by (status)`,
  ),
});

const formatPositiveValue = (v: number): string =>
  v === 0 || (v >= 0.001 && v < 1e23) ? humanizeNumberSI(v).string : v.toExponential(1);
export const formatValue = (v: number): string =>
  (v < 0 ? '-' : '') + formatPositiveValue(Math.abs(v));
export const formatDate = (date: Date) => {
  return dateFormatterNoYear.format(date);
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
  const numDays = Math.round(timespan / oneDayDuration);
  const d = new Date(Date.now());
  d.setHours(0, 0, 0, 0);
  while (xValues.length - 1 < numDays) {
    xValues.push(d.getTime());
    d.setDate(d.getDate() - 1);
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
export const PipelineMetricsTimeRangeOptions = () => ({
  '1d': i18next.t('pipelines-plugin~1 day'),
  '3d': i18next.t('pipelines-plugin~3 days'),
  '1w': i18next.t('pipelines-plugin~1 week'),
  '2w': i18next.t('pipelines-plugin~2 weeks'),
  '3w': i18next.t('pipelines-plugin~3 weeks'),
  '4w': i18next.t('pipelines-plugin~4 weeks'),
});
