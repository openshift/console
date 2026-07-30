import {
  setCloudShellExpanded,
  setCloudShellActive,
  addDetachedSession,
  removeDetachedSession,
  clearDetachedSessions,
  Actions,
} from '../cloud-shell-actions';

describe('Cloud shell actions', () => {
  it('should create expand action', () => {
    expect(setCloudShellExpanded(false)).toEqual(
      expect.objectContaining({
        type: Actions.SetCloudShellExpanded,
        payload: {
          isExpanded: false,
        },
      }),
    );
    expect(setCloudShellExpanded(true)).toEqual(
      expect.objectContaining({
        type: Actions.SetCloudShellExpanded,
        payload: {
          isExpanded: true,
        },
      }),
    );
  });

  it('should create active action', () => {
    expect(setCloudShellActive(false)).toEqual(
      expect.objectContaining({
        type: Actions.SetCloudShellActive,
        payload: {
          isActive: false,
        },
      }),
    );
    expect(setCloudShellActive(true)).toEqual(
      expect.objectContaining({
        type: Actions.SetCloudShellActive,
        payload: {
          isActive: true,
        },
      }),
    );
  });

  it('should create addDetachedSession action', () => {
    const session = {
      id: 'test-pod-container-123',
      podName: 'test-pod',
      namespace: 'default',
      containerName: 'container',
      command: ['sh', '-i'],
      cleanup: { type: 'namespace' as const, name: 'openshift-debug-abc' },
    };
    expect(addDetachedSession(session)).toEqual(
      expect.objectContaining({
        type: Actions.AddDetachedSession,
        payload: session,
      }),
    );
  });

  it('should create removeDetachedSession action', () => {
    expect(removeDetachedSession('session-1')).toEqual(
      expect.objectContaining({
        type: Actions.RemoveDetachedSession,
        payload: { id: 'session-1' },
      }),
    );
  });

  it('should create clearDetachedSessions action', () => {
    expect(clearDetachedSessions()).toEqual(
      expect.objectContaining({
        type: Actions.ClearDetachedSessions,
      }),
    );
  });
});
