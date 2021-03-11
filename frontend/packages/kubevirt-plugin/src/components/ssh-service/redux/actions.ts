export enum SSHActionsNames {
  updateKey = 'UPDATE_KEY',
  updateIsSSHServiceRunning = 'UPDATE_IS_SSH_SERVICE_RUNNING',
  showRestoreKey = 'SHOW_RESTORE_KEY',
  setTempKey = 'SET_TEMP_KEY',
  createSSHService = 'CREATE_SSH_SERVICE',
}

type SSHActionsObject = (
  val?: string | boolean,
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
  [SSHActionsNames.updateIsSSHServiceRunning]: (isRunning: boolean, machineName: string) => ({
    type: SSHActionsNames.updateIsSSHServiceRunning,
    payload: { machineName, isRunning },
  }),
  [SSHActionsNames.showRestoreKey]: (value: boolean) => ({
    type: SSHActionsNames.showRestoreKey,
    payload: value,
  }),
  [SSHActionsNames.setTempKey]: (value: string) => ({
    type: SSHActionsNames.setTempKey,
    payload: value,
  }),
  [SSHActionsNames.createSSHService]: (value: boolean) => ({
    type: SSHActionsNames.createSSHService,
    payload: value,
  }),
};
