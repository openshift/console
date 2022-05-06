import { sampleTektonConfigMetrics } from '../../../../test-data/tekon-config-data';
import { PipelineMetricsLevel } from '../../const';
import { getPipelineMetricsLevel } from '../pipeline-config';

describe('getPipelineMetricsLevel', () => {
  it('should return unsupported level for the invalid configuration combinations', () => {
    expect(
      getPipelineMetricsLevel(sampleTektonConfigMetrics[PipelineMetricsLevel.UNSUPPORTED_LEVEL]),
    ).toBe(PipelineMetricsLevel.UNSUPPORTED_LEVEL);
  });

  it('should return unsupported level if the config is not passed', () => {
    expect(getPipelineMetricsLevel(null)).toBe(PipelineMetricsLevel.UNSUPPORTED_LEVEL);
    expect(getPipelineMetricsLevel(undefined)).toBe(PipelineMetricsLevel.UNSUPPORTED_LEVEL);
  });

  it('should return unsupported level for null or invalid values', () => {
    expect(getPipelineMetricsLevel(null)).toBe(PipelineMetricsLevel.UNSUPPORTED_LEVEL);
    expect(getPipelineMetricsLevel(undefined)).toBe(PipelineMetricsLevel.UNSUPPORTED_LEVEL);
  });

  it('should return pipeline/task level for the pipeline task default configuration', () => {
    expect(
      getPipelineMetricsLevel(sampleTektonConfigMetrics[PipelineMetricsLevel.PIPELINE_TASK_LEVEL]),
    ).toBe(PipelineMetricsLevel.PIPELINE_TASK_LEVEL);
  });

  it('should return pipelinerun/taskrun level for the pipelinerun/taskrun and lastvalue as duration type', () => {
    expect(
      getPipelineMetricsLevel(
        sampleTektonConfigMetrics[PipelineMetricsLevel.PIPELINERUN_TASKRUN_LEVEL],
      ),
    ).toBe(PipelineMetricsLevel.PIPELINERUN_TASKRUN_LEVEL);
  });
});
