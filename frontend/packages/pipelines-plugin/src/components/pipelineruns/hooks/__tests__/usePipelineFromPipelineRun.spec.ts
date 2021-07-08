import { act } from 'react-dom/test-utils';
import * as k8s from '@console/internal/module/k8s';
import { testHook } from '../../../../../../../__tests__/utils/hooks-utils';
import {
  DataState,
  PipelineExampleNames,
  pipelineTestData,
} from '../../../../test-data/pipeline-data';
import { getPipelineFromPipelineRun } from '../../../../utils/pipeline-augment';
import { usePipelineFromPipelineRun } from '../usePipelineFromPipelineRun';

describe('usePipelineFromPipelineRun', () => {
  const pipelineData = pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE];
  const pipelineRun = pipelineData.pipelineRuns[DataState.SUCCESS];
  const plrWithEmbeddedPipeline =
    pipelineTestData[PipelineExampleNames.EMBEDDED_PIPELINE_SPEC].pipelineRuns[DataState.SUCCESS];
  const plrWithoutPipelineSpec = { ...pipelineRun, status: null };
  const k8sGetSpy = jest.spyOn(k8s, 'k8sGet');

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return pipeline from getPipelineFromPipelineRun if pipelineSpec is present in status field', () => {
    const {
      result: { current: pipeline },
    } = testHook(() => usePipelineFromPipelineRun(pipelineRun));
    expect(pipeline).toMatchObject(getPipelineFromPipelineRun(pipelineRun));
  });

  it('should return pipeline from getPipelineFromPipelineRun if pipelineSpec is present in spec field', () => {
    const {
      result: { current: pipeline },
    } = testHook(() => usePipelineFromPipelineRun(plrWithEmbeddedPipeline));
    expect(pipeline).toMatchObject(getPipelineFromPipelineRun(plrWithEmbeddedPipeline));
  });

  it('should return pipeline if pipelineSpec does not exist in status or spec field but pipelineRef in spec field has a valid name', async () => {
    k8sGetSpy.mockReturnValueOnce(Promise.resolve(pipelineData.pipeline));
    const { result, rerender } = testHook(() => usePipelineFromPipelineRun(plrWithoutPipelineSpec));
    await act(async () => {
      rerender();
    });
    expect(result.current).toMatchObject(pipelineData.pipeline);
  });

  it('should return empty pipeline if pipelineSpec does not exist in status or spec field and pipelineRef.name does not exist', async () => {
    const pipelineRunWithoutPipelineRef = {
      ...pipelineRun,
      spec: { ...pipelineRun.spec, pipelineRef: { name: null } },
      status: null,
    };
    const { result, rerender } = testHook(() =>
      usePipelineFromPipelineRun(pipelineRunWithoutPipelineRef),
    );
    await act(async () => {
      rerender();
    });
    expect(result.current).toMatchObject({ spec: { tasks: [] } });
    expect(k8sGetSpy).not.toHaveBeenCalled();
  });

  it('should return empty pipeline if pipelineSpec does not exist in status or spec field and pipelineRef.name does not exist', async () => {
    k8sGetSpy.mockReturnValueOnce(Promise.reject());
    const { result, rerender } = testHook(() => usePipelineFromPipelineRun(plrWithoutPipelineSpec));
    await act(async () => {
      rerender();
    });
    expect(result.current).toMatchObject({ spec: { tasks: [] } });
  });

  it('should return null until network call is resolved', async () => {
    k8sGetSpy.mockReturnValueOnce(Promise.resolve(pipelineData.pipeline));
    const { result, rerender } = testHook(() => usePipelineFromPipelineRun(plrWithoutPipelineSpec));
    await act(async () => {
      rerender();
      expect(result.current).toBeNull();
    });
  });
});
