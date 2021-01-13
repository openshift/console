import { Dispatch } from 'react-redux';
import cloudShellConfirmationModal from '../../../components/cloud-shell/cloudShellConfirmationModal';
import {
  setCloudShellExpanded,
  setCloudShellActive,
  Actions,
  toggleCloudShellExpanded,
} from '../cloud-shell-actions';

const cloudShellConfirmationModalMock = cloudShellConfirmationModal as jest.Mock;

jest.mock('../../../components/cloud-shell/cloudShellConfirmationModal', () => ({
  default: jest.fn((action) => action()),
}));

describe('Cloud shell actions', () => {
  beforeEach(() => {
    cloudShellConfirmationModalMock.mockClear();
  });

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

  it('should thunk dispatch toggle expand true action', () => {
    const dispatch = jest.fn<Dispatch>();
    // initial isExpanded state is false
    const state = { plugins: { console: { cloudShell: { isExpanded: false } } } } as any;
    toggleCloudShellExpanded()(dispatch, () => state);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: Actions.SetCloudShellExpanded,
        payload: {
          isExpanded: true,
        },
      }),
    );
  });

  it('should thunk dispatch toggle expand false action without confirmation', () => {
    const dispatch = jest.fn<Dispatch>();
    // initial isExpanded state is true but isActive is false
    const state = {
      plugins: { console: { cloudShell: { isExpanded: true, isActive: false } } },
    } as any;
    toggleCloudShellExpanded()(dispatch, () => state);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: Actions.SetCloudShellExpanded,
        payload: {
          isExpanded: false,
        },
      }),
    );

    expect(cloudShellConfirmationModal).not.toHaveBeenCalled();
  });

  it('should thunk dispatch toggle expand false action with confirmation', async () => {
    const dispatch = jest.fn<Dispatch>();
    // initial isExpanded state is true and isActive is true
    const state = {
      plugins: { console: { cloudShell: { isExpanded: true, isActive: true } } },
    } as any;
    await toggleCloudShellExpanded()(dispatch, () => state);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: Actions.SetCloudShellExpanded,
        payload: {
          isExpanded: false,
        },
      }),
    );

    expect(cloudShellConfirmationModal).toHaveBeenCalled();
  });

  it('should thunk dispatch toggle expand true action', () => {
    const dispatch = jest.fn<Dispatch>();
    // initial isExpanded state is false
    const state = { plugins: { console: { cloudShell: { isExpanded: false } } } } as any;
    toggleCloudShellExpanded()(dispatch, () => state);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: Actions.SetCloudShellExpanded,
        payload: {
          isExpanded: true,
        },
      }),
    );

    expect(cloudShellConfirmationModal).not.toHaveBeenCalled();
  });
});
