import { podReadiness, podPhase } from '../../../public/module/k8s/pods';

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
    invalidPods.forEach(p => {
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
      {state: {waiting: {reason: 'Unschedulable'}}},
      {state: {terminated: {reason: 'Initialized'}}},
      {state: {waiting: {reason: 'Ready'}}},
      {state: {running: {}}},
    ];
    const expectedPhase: string = pod.status.containerStatuses
      .filter(({state}) => state.waiting !== undefined || state.terminated !== undefined)
      .map(({state}) => state.waiting !== undefined ? state.waiting.reason : state.terminated.reason)
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
        conditions: [
          {type: 'Ready', status: 'True'},
        ]
      }
    };
  });

  it('returns null if given conditions list is empty', () => {
    pod.status.conditions = [];
    const readiness = podReadiness(pod);

    expect(readiness).toBe(null);
  });

  it('returns "Ready" if all condition status are set to "True"', () => {
    const readiness = podReadiness(pod);

    expect(readiness).toEqual('Ready');
  });

  it('returns `reason` of the condition with the oldest `lastTransitionTime` if not all ready', () => {
    pod.status.conditions = pod.status.conditions.concat([
      {type: 'Initialized', status: 'False', lastTransitionTime: '2017-04-01T12:00:00Z', reason: 'Ready'},
      {type: 'PodScheduled', status: 'True', lastTransitionTime: '2017-03-01T12:00:00Z', reason: 'Initialized'},
      {type: 'Unschedulable', status: 'False', lastTransitionTime: '2017-02-01T12:00:00Z', reason: 'Unschedulable'},
    ]);
    const expectedReadiness: string = pod.status.conditions
      .filter(condition => condition.status !== 'True')
      .sort((a, b) => new Date(a.lastTransitionTime) < new Date(b.lastTransitionTime) ? -1 : 1)[0].reason;

    const readiness = podReadiness(pod);

    expect(readiness).toEqual(expectedReadiness);
  });

  it('returns `type` of the condition with the oldest `lastTransitionTime` if not all ready and `reason` is undefined', () => {
    pod.status.conditions = pod.status.conditions.concat([
      {type: 'Initialized', status: 'False', lastTransitionTime: '2017-04-01T12:00:00Z'},
      {type: 'PodScheduled', status: 'True', lastTransitionTime: '2017-03-01T12:00:00Z'},
      {type: 'Unschedulable', status: 'False', lastTransitionTime: '2017-02-01T12:00:00Z'},
    ]);
    const expectedReadiness: string = pod.status.conditions
      .filter(condition => condition.status !== 'True')
      .sort((a, b) => new Date(a.lastTransitionTime) < new Date(b.lastTransitionTime) ? -1 : 1)[0].type;

    const readiness = podReadiness(pod);

    expect(readiness).toEqual(expectedReadiness);
  });
});
