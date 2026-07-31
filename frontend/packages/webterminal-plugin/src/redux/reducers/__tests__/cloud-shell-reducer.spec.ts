import {
  setCloudShellExpanded,
  setCloudShellActive,
  addDetachedSession,
  removeDetachedSession,
  clearDetachedSessions,
} from '../../actions/cloud-shell-actions';
import type { DetachedSession } from '../../actions/cloud-shell-actions';
import reducer, { MAX_DETACHED_SESSIONS } from '../cloud-shell-reducer';

const makeSession = (id: string): DetachedSession => ({
  id,
  podName: `pod-${id}`,
  namespace: 'default',
  containerName: 'container-00',
});

describe('Cloud shell reducer', () => {
  it('should have initial state', () => {
    const state = reducer(undefined, { type: 'test' } as any);
    expect(state.isExpanded).toBe(false);
    expect(state.isActive).toBe(false);
    expect(state.detachedSessions).toEqual([]);
  });

  it('should set expanded', () => {
    let state = reducer(undefined, setCloudShellExpanded(true));
    expect(state.isExpanded).toBe(true);
    state = reducer(state, setCloudShellExpanded(false));
    expect(state.isExpanded).toBe(false);
  });

  it('should set active', () => {
    let state = reducer(undefined, setCloudShellActive(true));
    expect(state.isActive).toBe(true);
    state = reducer(state, setCloudShellActive(false));
    expect(state.isActive).toBe(false);
  });

  describe('detached sessions', () => {
    it('should add a detached session', () => {
      const session = makeSession('s1');
      const state = reducer(undefined, addDetachedSession(session));
      expect(state.detachedSessions).toHaveLength(1);
      expect(state.detachedSessions[0]).toEqual(session);
    });

    it('should reject duplicate session ids', () => {
      const session = makeSession('s1');
      let state = reducer(undefined, addDetachedSession(session));
      state = reducer(state, addDetachedSession(session));
      expect(state.detachedSessions).toHaveLength(1);
    });

    it('should block additions at MAX_DETACHED_SESSIONS', () => {
      let state = reducer(undefined, { type: 'test' } as any);
      for (let i = 0; i < MAX_DETACHED_SESSIONS; i++) {
        state = reducer(state, addDetachedSession(makeSession(`s${i}`)));
      }
      expect(state.detachedSessions).toHaveLength(MAX_DETACHED_SESSIONS);

      state = reducer(state, addDetachedSession(makeSession('overflow')));
      expect(state.detachedSessions).toHaveLength(MAX_DETACHED_SESSIONS);
      expect(state.detachedSessions.some((s) => s.id === 'overflow')).toBe(false);
    });

    it('should remove a detached session by id', () => {
      let state = reducer(undefined, addDetachedSession(makeSession('s1')));
      state = reducer(state, addDetachedSession(makeSession('s2')));
      expect(state.detachedSessions).toHaveLength(2);

      state = reducer(state, removeDetachedSession('s1'));
      expect(state.detachedSessions).toHaveLength(1);
      expect(state.detachedSessions[0].id).toBe('s2');
    });

    it('should clear all detached sessions', () => {
      let state = reducer(undefined, addDetachedSession(makeSession('s1')));
      state = reducer(state, addDetachedSession(makeSession('s2')));
      state = reducer(state, addDetachedSession(makeSession('s3')));
      expect(state.detachedSessions).toHaveLength(3);

      state = reducer(state, clearDetachedSessions());
      expect(state.detachedSessions).toEqual([]);
    });
  });
});
