import { setCloudShellExpanded, setCloudShellActive, Actions } from '../cloud-shell-actions';

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
});
