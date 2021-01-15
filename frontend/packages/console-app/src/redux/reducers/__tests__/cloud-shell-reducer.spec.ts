import { setCloudShellExpanded, setCloudShellActive } from '../../actions/cloud-shell-actions';
import reducer from '../cloud-shell-reducer';

describe('Cloud shell reducer', () => {
  it('should have initial state', () => {
    // create an unsupported test action
    const state = reducer(undefined, { type: 'test' } as any);
    expect(state.isExpanded).toBe(false);
    expect(state.isActive).toBe(false);
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
});
