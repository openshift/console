import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { testHook } from '@console/shared/src/test-utils/hooks-utils';
import { EventInvolvedObject } from '@console/internal/module/k8s';
import { DataState, PipelineExampleNames, pipelineTestData } from '../../../../test/pipeline-data';
import { PipelineRun } from '../../../../utils/pipeline-augment';
import * as eventUtils from '../event-utils';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

const pipeline = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];
const pipelineRun: PipelineRun = pipeline.pipelineRuns[DataState.SUCCESS];
const {
  metadata: { namespace },
} = pipelineRun;
const { taskRuns, pods } = pipeline;

describe('usePipelineRunFilters:', () => {
  beforeEach(() => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      taskruns: { data: taskRuns, loaded: true },
      pods: { data: pods, loaded: true },
    });
  });
  it('should return the pipeline run filters', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      taskruns: { data: [], loaded: true },
      pods: { data: [], loaded: true },
    });
    testHook(() => {
      const filters = eventUtils.usePipelineRunFilters(namespace, pipelineRun);
      expect(filters).toHaveLength(3);
    });
  });

  it('should return true if the involved objects matches with assoicated pipelinerun resources', () => {
    const PipelineRunInvolvedObj: EventInvolvedObject = {
      uid: pipelineRun.metadata.uid,
      kind: pipelineRun.kind,
    };
    const taskRunInvolvedObj: EventInvolvedObject = {
      uid: taskRuns[0].metadata.uid,
      kind: taskRuns[0].kind,
    };
    const podInvolvedObj: EventInvolvedObject = {
      uid: pods[0].metadata.uid,
      kind: pods[0].kind,
    };
    testHook(() => {
      const filters = eventUtils.usePipelineRunFilters(namespace, pipelineRun);
      expect(filters.some((filter) => filter(PipelineRunInvolvedObj))).toBeTruthy();
      expect(filters.some((filter) => filter(taskRunInvolvedObj))).toBeTruthy();
      expect(filters.some((filter) => filter(podInvolvedObj))).toBeTruthy();
    });
  });

  it('should return false if the involved objects matches with assoicated pipelinerun resources', () => {
    const unrelatedPlrInvolvedObj: EventInvolvedObject = {
      uid: 'cbe7e8db-c641-11e8-8889-0242ac110004',
      kind: pipelineRun.kind,
    };

    testHook(() => {
      const filters = eventUtils.usePipelineRunFilters(namespace, pipelineRun);
      expect(filters.some((filter) => filter(unrelatedPlrInvolvedObj))).toBeFalsy();
    });
  });
});

describe('useTaskRunFilters:', () => {
  beforeEach(() => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      taskruns: { data: taskRuns, loaded: true },
      pods: { data: pods, loaded: true },
    });
  });
  it('should return the task run and associated pod filters', () => {
    testHook(() => {
      const filters = eventUtils.useTaskRunFilters(namespace, taskRuns[0]);
      expect(filters).toHaveLength(2);
    });
  });

  it('should return true if the taskrun matches with event involved object', () => {
    const involvedObj: EventInvolvedObject = {
      uid: taskRuns[0].metadata.uid,
      kind: taskRuns[0].kind,
    };

    testHook(() => {
      const filters = eventUtils.useTaskRunFilters(namespace, taskRuns[0]);
      expect(filters.some((filter) => filter(involvedObj))).toBeTruthy();
    });
  });

  it('should return true if the pod matches with event involved object', () => {
    const involvedObj: EventInvolvedObject = {
      uid: pods[0].metadata.uid,
      kind: pods[0].kind,
    };

    testHook(() => {
      const filters = eventUtils.useTaskRunFilters(namespace, taskRuns[0]);
      expect(filters.some((filter) => filter(involvedObj))).toBeTruthy();
    });
  });

  it('should return false if involved object uid is not matched', () => {
    const unrelatedInvolvedObj: EventInvolvedObject = {
      uid: 'cbe7e8db-c641-11e8-8889-0242ac110004',
      kind: pods[0].kind,
    };

    testHook(() => {
      const filters = eventUtils.useTaskRunFilters(namespace, taskRuns[0]);
      expect(filters.some((filter) => filter(unrelatedInvolvedObj))).toBeFalsy();
    });
  });

  it('should return false if unsupported kind is supplied in event involved object', () => {
    const involvedObj: EventInvolvedObject = {
      uid: pods[0].metadata.uid,
      kind: 'Depolyment',
    };

    testHook(() => {
      const filters = eventUtils.useTaskRunFilters(namespace, taskRuns[0]);
      expect(filters.some((filter) => filter(involvedObj))).toBeFalsy();
    });
  });

  it('should return false if watched resources are empty', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      taskruns: { data: [], loaded: true },
      pods: { data: [], loaded: true },
    });
    const involvedObj: EventInvolvedObject = {
      uid: pods[0].metadata.uid,
      kind: pods[0].kind,
    };

    testHook(() => {
      const filters = eventUtils.useTaskRunFilters(namespace, taskRuns[0]);
      expect(filters.some((filter) => filter(involvedObj))).toBeFalsy();
    });
  });
});
