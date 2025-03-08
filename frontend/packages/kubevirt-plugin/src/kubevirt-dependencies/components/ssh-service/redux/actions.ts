export enum SSHActionsNames {
  updateKey = 'UPDATE_KEY',
  updateSSHServices = 'UPDATE_SSH_SERVICES',
  disableSaveInNamespaceCheckbox = 'DISABLE_SAVE_IN_NAMESPACE_CHECKBOX',
  showRestoreKeyButton = 'SHOW_RESTORE_KEY_BUTTON',
  setTempSSHKey = 'SET_TEMP_KEY',
  enableSSHService = 'ENABLE_SSH_SERVICE',
  setIsValidSSHKey = 'SET_IS_VALID_SSH_KEY',
  updateSSHKeyInGlobalNamespaceSecret = 'UPDATE_SSH_KEY_IN_GLOBAL_NAMESPACE_SECRET',
  restoreDefaultSSHSettings = 'RESTORE_DEFAULT_SSH_SETTINGS',
}

type SSHActionsObject = (
  val?: string | boolean,
  port?: number | string,
  machineName?: string,
) => {
  type: string;
  payload: string | boolean | null | undefined | { [key: string]: any };
};

type SSHActions = { [key in SSHActionsNames]: SSHActionsObject };

export const sshActions: SSHActions = {
  [SSHActionsNames.updateKey]: (namespace: string, key?: string) => ({
    type: SSHActionsNames.updateKey,
    payload: { namespace, key },
  }),
  [SSHActionsNames.updateSSHServices]: (
    isRunning: boolean,
    port: number | string,
    machineName: string,
  ) => ({
    type: SSHActionsNames.updateSSHServices,
    payload: { machineName, isRunning, port },
  }),
  [SSHActionsNames.showRestoreKeyButton]: (value: boolean) => ({
    type: SSHActionsNames.showRestoreKeyButton,
    payload: value,
  }),
  [SSHActionsNames.setTempSSHKey]: (value: string) => ({
    type: SSHActionsNames.setTempSSHKey,
    payload: value,
  }),
  [SSHActionsNames.enableSSHService]: (value: boolean) => ({
    type: SSHActionsNames.enableSSHService,
    payload: value,
  }),
  [SSHActionsNames.disableSaveInNamespaceCheckbox]: (value: boolean) => ({
    type: SSHActionsNames.disableSaveInNamespaceCheckbox,
    payload: value,
  }),
  [SSHActionsNames.setIsValidSSHKey]: (value: boolean) => ({
    type: SSHActionsNames.setIsValidSSHKey,
    payload: value,
  }),
  [SSHActionsNames.updateSSHKeyInGlobalNamespaceSecret]: (value: boolean) => ({
    type: SSHActionsNames.updateSSHKeyInGlobalNamespaceSecret,
    payload: value,
  }),
  [SSHActionsNames.restoreDefaultSSHSettings]: () => ({
    type: SSHActionsNames.restoreDefaultSSHSettings,
    payload: null,
  }),
};
