import { PodKind } from '../../../module/k8s';
import { podCompare } from '../pods-overview';

const runningPod = (name: string): PodKind => ({
  metadata: {
    name,
  },
  spec: { containers: [] },
  status: {
    phase: 'Running',
  },
});

const failedPod = (name: string): PodKind => ({
  metadata: {
    name,
  },
  spec: { containers: [] },
  status: {
    phase: 'Failed',
    reason: 'A reason',
  },
});

const deletedPod = (name: string): PodKind => ({
  metadata: {
    name,
    deletionTimestamp: '2010-01-01',
  },
  spec: { containers: [] },
  status: {
    phase: 'Running',
    reason: 'Terminating',
  },
});

const evictedPod = (name: string): PodKind => ({
  metadata: {
    name,
  },
  spec: { containers: [] },
  status: {
    phase: 'Failed',
    reason: 'Evicted',
  },
});

describe('podCompare', () => {
  it('should sort running pods with last updated time', () => {
    const commonValues = {
      name: 'test',
      ready: true,
      restartCount: 0,
      image: 'test',
      imageID: 'test',
    };
    const p1 = runningPod('pod-1');
    p1.status.containerStatuses = [
      { state: { running: { startedAt: '2020-05-05' } }, ...commonValues },
    ];
    const p2 = runningPod('pod-2');
    p2.status.containerStatuses = [
      { state: { running: { startedAt: '2021-07-14' } }, ...commonValues },
    ];
    const p3 = runningPod('pod-3');
    p3.status.containerStatuses = [
      { state: { running: { startedAt: '2010-01-01' } }, ...commonValues },
    ];
    const podsList: PodKind[] = [p1, p2, p3];
    podsList.sort(podCompare);
    expect(podsList.map((pod) => pod.metadata.name)).toEqual(['pod-2', 'pod-1', 'pod-3']);
  });

  it('should show failed pods first', () => {
    const podsList: PodKind[] = [
      failedPod('failed-pod-1'),
      runningPod('pod-1'),
      failedPod('failed-pod-2'),
      runningPod('pod-2'),
    ];
    podsList.sort(podCompare);
    expect(podsList.map((pod) => pod.metadata.name)).toEqual([
      'failed-pod-1',
      'failed-pod-2',
      'pod-1',
      'pod-2',
    ]);
  });

  it('should show failed pods first and evicted pods last', () => {
    const podsList: PodKind[] = [
      failedPod('failed-pod-3'),
      evictedPod('ev-pod-2'),
      runningPod('pod-2'),
      failedPod('failed-pod-1'),
      evictedPod('ev-pod-1'),
      runningPod('pod-1'),
      failedPod('failed-pod-2'),
    ];
    podsList.sort(podCompare);
    expect(podsList.map((pod) => pod.metadata.name)).toEqual([
      'failed-pod-1',
      'failed-pod-2',
      'failed-pod-3',
      'pod-1',
      'pod-2',
      'ev-pod-1',
      'ev-pod-2',
    ]);
  });

  it('should show deleted pods first and evicted pods last', () => {
    const podsList: PodKind[] = [
      deletedPod('deleted-pod-1'),
      evictedPod('ev-pod-1'),
      runningPod('pod-1'),
      deletedPod('deleted-pod-2'),
      evictedPod('ev-pod-2'),
      runningPod('pod-2'),
      deletedPod('deleted-pod-3'),
    ];
    podsList.sort(podCompare);
    expect(podsList.map((pod) => pod.metadata.name)).toEqual([
      'deleted-pod-1',
      'deleted-pod-2',
      'deleted-pod-3',
      'pod-1',
      'pod-2',
      'ev-pod-1',
      'ev-pod-2',
    ]);
  });

  it('should show evicted pods last', () => {
    const podsList: PodKind[] = [
      evictedPod('ev-pod-0'),
      runningPod('pod-1'),
      evictedPod('ev-pod-1'),
      runningPod('pod-2'),
    ];
    podsList.sort(podCompare);
    expect(podsList[2].metadata.name).toBe('ev-pod-0');
    expect(podsList[3].metadata.name).toBe('ev-pod-1');
    expect(podsList.map((pod) => pod.metadata.name)).toEqual([
      'pod-1',
      'pod-2',
      'ev-pod-0',
      'ev-pod-1',
    ]);
  });
});
