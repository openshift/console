import { SSHActionsNames } from './actions';

const initialState = {
  globalKeys: null,
  isSSHServiceRunning: {},
  showRestoreKey: false,
  tempKey: null,
  createSSHService: true,
};

const authorizedSSHKeysReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case SSHActionsNames.updateKey:
      return { ...state, globalKeys: { ...state.globalKeys, [payload?.namespace]: payload?.key } };
    case SSHActionsNames.updateIsSSHServiceRunning:
      return {
        ...state,
        isSSHServiceRunning: {
          ...state.isSSHServiceRunning,
          [payload?.machineName]: payload?.isRunning,
        },
      };
    case SSHActionsNames.showRestoreKey:
      return { ...state, showRestoreKey: payload };
    case SSHActionsNames.setTempKey:
      return { ...state, tempKey: payload };
    case SSHActionsNames.createSSHService:
      return { ...state, createSSHService: payload };
    default:
      return state;
  }
};

export default authorizedSSHKeysReducer;
