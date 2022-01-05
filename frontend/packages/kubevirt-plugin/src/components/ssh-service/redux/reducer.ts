import { SSHActionsNames } from './actions';

const initialState = {
  globalKeys: null,
  sshServices: {},
  showRestoreKeyButton: true,
  tempSSHKey: null,
  enableSSHService: false,
  disableSaveInNamespaceCheckbox: null,
  isValidSSHKey: true,
  updateSSHKeyInGlobalNamespaceSecret: false,
};

const authorizedSSHKeysReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case SSHActionsNames.updateKey:
      return { ...state, globalKeys: { ...state.globalKeys, [payload?.namespace]: payload?.key } };
    case SSHActionsNames.updateSSHServices:
      return {
        ...state,
        sshServices: {
          ...state.sshServices,
          [payload?.machineName]: { running: payload?.isRunning, port: payload?.port },
        },
      };
    case SSHActionsNames.showRestoreKeyButton:
      return { ...state, showRestoreKeyButton: payload };
    case SSHActionsNames.setTempSSHKey:
      return { ...state, tempSSHKey: payload };
    case SSHActionsNames.enableSSHService:
      return { ...state, enableSSHService: payload };
    case SSHActionsNames.disableSaveInNamespaceCheckbox:
      return { ...state, disableSaveInNamespaceCheckbox: payload };
    case SSHActionsNames.setIsValidSSHKey:
      return { ...state, isValidSSHKey: payload };
    case SSHActionsNames.updateSSHKeyInGlobalNamespaceSecret:
      return { ...state, updateSSHKeyInGlobalNamespaceSecret: payload };
    case SSHActionsNames.restoreDefaultSSHSettings:
      return { ...initialState };
    default:
      return state;
  }
};

export default authorizedSSHKeysReducer;
