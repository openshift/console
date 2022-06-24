import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { TektonConfigModel } from '@console/pipelines-plugin/src/models';
import { TektonConfig, MetricsLevel, LevelTypes, DurationTypes } from '../../../types';
import { PipelineMetricsLevel, PIPELINE_CONFIG_NAME } from '../const';

export const usePipelineConfig = () =>
  useK8sGet<TektonConfig>(TektonConfigModel, PIPELINE_CONFIG_NAME);

export const getPipelineMetricsLevel = (config: TektonConfig): string => {
  if (!config) {
    return PipelineMetricsLevel.UNSUPPORTED_LEVEL;
  }
  const { pipeline } = config.spec;
  if (
    pipeline[MetricsLevel.METRICS_PIPELINERUN_DURATION_TYPE] === DurationTypes.HISTOGRAM &&
    pipeline[MetricsLevel.METRICS_TASKRUN_DURATION_TYPE] === DurationTypes.HISTOGRAM &&
    pipeline[MetricsLevel.METRICS_PIPELINERUN_LEVEL] === LevelTypes.PIPELINE &&
    pipeline[MetricsLevel.METRICS_TASKRUN_LEVEL] === LevelTypes.TASK
  ) {
    return PipelineMetricsLevel.PIPELINE_TASK_LEVEL;
  }
  if (
    pipeline[MetricsLevel.METRICS_PIPELINERUN_DURATION_TYPE] === DurationTypes.LASTVALUE &&
    pipeline[MetricsLevel.METRICS_TASKRUN_DURATION_TYPE] === DurationTypes.LASTVALUE &&
    pipeline[MetricsLevel.METRICS_PIPELINERUN_LEVEL] === LevelTypes.PIPELINERUN &&
    pipeline[MetricsLevel.METRICS_TASKRUN_LEVEL] === LevelTypes.TASKRUN
  ) {
    return PipelineMetricsLevel.PIPELINERUN_TASKRUN_LEVEL;
  }
  return PipelineMetricsLevel.UNSUPPORTED_LEVEL;
};
