import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { VMIKind, VMKind } from '@console/kubevirt-plugin/src/types';
import { AUTHORIZED_SSH_KEYS } from '../components/ssh-service/SSHForm/ssh-form-utils';
import useSecret, { useSecretResult } from './use-secret';
import useSSHSelectors, { useSSHSelectorsResult } from './use-ssh-selectors';

export type useSSHResult = useSecretResult &
  Omit<useSSHSelectorsResult, 'globalKeys' | 'sshServices'> & { key: string };

const useSSHKeys = (vm?: VMIKind | VMKind): useSSHResult => {
  const { metadata } = vm || {};
  const location = useLocation();
  const namespace = metadata?.namespace || new URLSearchParams(location?.search)?.get('namespace');
  const {
    globalKeys,
    disableSaveInNamespaceCheckbox,
    showRestoreKeyButton,
    enableSSHService,
    tempSSHKey,
    isValidSSHKey,
    updateSSHKeyInGlobalNamespaceSecret,
    updateSSHKey,
    updateSSHTempKey,
    setIsValidSSHKey,
    setEnableSSHService,
    setUpdateSSHKeyInSecret,
    restoreDefaultSSHSettings,
  } = useSSHSelectors();

  const { secret, isSecretLoaded, secretLoadingError, createOrUpdateSecret } = useSecret({
    secretName: AUTHORIZED_SSH_KEYS,
    namespace,
  });

  const updateSSHKeys = React.useCallback(
    (sshKey?: string) => {
      let decodedKey = '';
      try {
        decodedKey = atob(sshKey);
      } catch {
        decodedKey = sshKey;
      }
      if (namespace) {
        updateSSHKey(namespace, decodedKey);
        updateSSHTempKey(decodedKey);
      }
    },
    [namespace, updateSSHKey, updateSSHTempKey],
  );

  React.useEffect(() => {
    namespace && updateSSHKeys(secret?.data?.key);
  }, [secret, isSecretLoaded, namespace, updateSSHKey, updateSSHKeys]);

  return {
    key: globalKeys?.[namespace],
    secret,
    isSecretLoaded,
    secretLoadingError,
    updateSSHKey,
    createOrUpdateSecret,
    disableSaveInNamespaceCheckbox,
    showRestoreKeyButton,
    enableSSHService,
    tempSSHKey,
    updateSSHTempKey,
    isValidSSHKey,
    setIsValidSSHKey,
    updateSSHKeyInGlobalNamespaceSecret,
    setEnableSSHService,
    setUpdateSSHKeyInSecret,
    restoreDefaultSSHSettings,
  };
};

export default useSSHKeys;
