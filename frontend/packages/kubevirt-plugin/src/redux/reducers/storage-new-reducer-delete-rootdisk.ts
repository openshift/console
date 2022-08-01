import { DiskActionsNames } from '../actions/diskActions';

const initialState = { removeRootdisk: true };

const diskReducer = (state = initialState, { type }) => {
  switch (type) {
    case DiskActionsNames.removeRootdisk:
      return { ...state, removeRootdisk: false };
    case DiskActionsNames.setInitialRootdisk:
      return { ...initialState };
    default:
      return state;
  }
};

export default diskReducer;
