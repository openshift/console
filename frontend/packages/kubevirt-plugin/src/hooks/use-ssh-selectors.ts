import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { RootStateOrAny, useDispatch, useSelector } from 'react-redux';
import { sshActions, SSHActionsNames } from '../components/ssh-service/redux/actions';

export type SSHState = {
  globalKeys: { [key: string]: string };
  disableSaveInNamespaceCheckbox: null | boolean;
  showRestoreKeyButton: boolean;
  enableSSHService: boolean;
  tempSSHKey: string | null;
  isValidSSHKey: boolean;
  updateSSHKeyInGlobalNamespaceSecret: boolean;
  sshServices: { [key: string]: { running: boolean; port: number } };
};

export type useSSHSelectorsResult = SSHState & {
  updateSSHKey: (namespace: string, decodedKey: string) => void;
  updateSSHTempKey: (sshKey?: string) => void;
  setIsValidSSHKey: (value: boolean) => void;
  setUpdateSSHKeyInSecret: (value: boolean) => void;
  restoreDefaultSSHSettings: () => void;
  setEnableSSHService: (value: boolean) => void;
};

const useSSHSelectors = (): useSSHSelectorsResult => {
  const dispatch = useDispatch();
  const sshState = useSelector(
    (state: RootStateOrAny): SSHState => state?.plugins?.kubevirt?.authorizedSSHKeys,
  );

  const updateSSHKey = React.useCallback(
    (namespace: string, decodedKey: string) => {
      dispatch(sshActions[SSHActionsNames.updateKey](namespace, decodedKey));
    },
    [dispatch],
  );

  const updateSSHTempKey = React.useCallback(
    (sshKey?: string) => {
      dispatch(sshActions[SSHActionsNames.setTempSSHKey](sshKey));
    },
    [dispatch],
  );

  const setIsValidSSHKey = React.useCallback(
    (value: boolean) => {
      dispatch(sshActions[SSHActionsNames.setIsValidSSHKey](value));
    },
    [dispatch],
  );

  const setUpdateSSHKeyInSecret = React.useCallback(
    (value: boolean) => {
      dispatch(sshActions[SSHActionsNames.updateSSHKeyInGlobalNamespaceSecret](value));
    },
    [dispatch],
  );

  const setEnableSSHService = React.useCallback(
    (val: boolean) => dispatch(sshActions[SSHActionsNames.enableSSHService](val)),
    [dispatch],
  );

  const restoreDefaultSSHSettings = React.useCallback(() => {
    dispatch(sshActions[SSHActionsNames.restoreDefaultSSHSettings]());
  }, [dispatch]);

  return {
    globalKeys: sshState?.globalKeys,
    disableSaveInNamespaceCheckbox: sshState?.disableSaveInNamespaceCheckbox,
    showRestoreKeyButton: sshState?.showRestoreKeyButton,
    enableSSHService: sshState?.enableSSHService,
    tempSSHKey: sshState?.tempSSHKey,
    isValidSSHKey: sshState?.isValidSSHKey,
    updateSSHKeyInGlobalNamespaceSecret: sshState?.updateSSHKeyInGlobalNamespaceSecret,
    sshServices: sshState?.sshServices,
    updateSSHKey,
    updateSSHTempKey,
    setIsValidSSHKey,
    setUpdateSSHKeyInSecret,
    setEnableSSHService,
    restoreDefaultSSHSettings,
  };
};

export default useSSHSelectors;
