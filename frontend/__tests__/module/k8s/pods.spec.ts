import { podPhase, podReadiness, podRestarts } from '../../../public/module/k8s/pods';

describe('podPhase', () => {
  let pod;

  beforeEach(() => {
    pod = {
      metadata: {},
      status: {},
    };
  });

  it('returns empty string if given invalid pod', () => {
    const invalidPods: any[] = [null, undefined, {}];
    invalidPods.forEach((p) => {
      const phase: string = podPhase(p);

      expect(phase).toEqual('');
    });
  });

  it('returns `Terminating` if given pod has a deletion timestamp', () => {
    pod.metadata.deletionTimestamp = '2017-08-14T03:51:45Z';
    const phase: string = podPhase(pod);

    expect(phase).toEqual('Terminating');
  });

  it('returns the pod status phase', () => {
    pod.status.phase = 'Pending';
    const phase: string = podPhase(pod);

    expect(phase).toEqual(pod.status.phase);
  });

  it('returns the pod status reason if defined', () => {
    pod.status.reason = 'Unschedulable';
    const phase: string = podPhase(pod);

    expect(phase).toEqual(pod.status.reason);
  });

  it('returns the state reason of the last waiting or terminated container in the pod', () => {
    pod.status.containerStatuses = [
      { state: { waiting: { reason: 'Unschedulable' } } },
      { state: { terminated: { reason: 'Initialized' } } },
      { state: { waiting: { reason: 'Ready' } } },
      { state: { running: {} } },
    ];
    const expectedPhase: string = pod.status.containerStatuses
      .filter(({ state }) => state.waiting !== undefined || state.terminated !== undefined)
      .map(({ state }) =>
        state.waiting !== undefined ? state.waiting.reason : state.terminated.reason,
      )
      .slice(-1)[0];
    const phase: string = podPhase(pod);

    expect(phase).toEqual(expectedPhase);
  });
});

describe('podReadiness', () => {
  let pod;

  beforeEach(() => {
    pod = {
      status: {
        phase: 'Running',
        initContainerStatuses: [
          {
            ready: true,
          },
        ],
        containerStatuses: [
          {
            ready: true,
          },
          {
            ready: true,
          },
        ],
      },
    };
  });

  it('returns 0 if no status stanza', () => {
    delete pod.status;
    const { readyCount, totalContainers } = podReadiness(pod);

    expect(readyCount).toBe(0);
    expect(totalContainers).toBe(0);
  });

  it('returns correct count for containers', () => {
    pod.status.initContainerStatuses = [];
    const { readyCount, totalContainers } = podReadiness(pod);

    expect(readyCount).toEqual(2);
    expect(totalContainers).toEqual(2);
  });

  it("doesn't include init containers in count", () => {
    const { readyCount, totalContainers } = podReadiness(pod);

    expect(readyCount).toEqual(2);
    expect(totalContainers).toEqual(2);
  });

  it("returns correct count when container isn't ready", () => {
    pod.status.containerStatuses[0].ready = false;
    const { readyCount, totalContainers } = podReadiness(pod);

    expect(readyCount).toEqual(1);
    expect(totalContainers).toEqual(2);
  });
});

describe('podRestarts', () => {
  let pod;

  beforeEach(() => {
    pod = {
      status: {
        phase: 'Running',
        initContainerStatuses: [
          {
            restartCount: 1,
            state: {
              terminated: {
                exitCode: 0,
              },
            },
          },
        ],
        containerStatuses: [
          {
            restartCount: 1,
          },
          {
            restartCount: 2,
          },
        ],
      },
    };
  });

  it('returns 0 if no status stanza', () => {
    delete pod.status;
    const restartCount = podRestarts(pod);

    expect(restartCount).toBe(0);
  });

  it('returns init container count if not terminated', () => {
    pod.status.initContainerStatuses = [
      {
        restartCount: 1,
        state: {
          running: {
            startedAt: '2020-03-13T12:30:13Z',
          },
        },
      },
    ];
    const restartCount = podRestarts(pod);

    expect(restartCount).toBe(1);
  });

  it('returns init container count if terminated with non-zero exit code', () => {
    pod.status.initContainerStatuses[0].state.terminated.exitCode = 1;
    const restartCount = podRestarts(pod);

    expect(restartCount).toBe(1);
  });

  it("doesn't include init containers after initialization", () => {
    const restartCount = podRestarts(pod);

    expect(restartCount).toBe(3);
  });
});
