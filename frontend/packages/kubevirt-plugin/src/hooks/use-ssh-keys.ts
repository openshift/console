import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch, useSelector, RootStateOrAny } from 'react-redux';
import { SecretKind, k8sCreate } from '@console/internal/module/k8s';
import { SecretModel } from '@console/internal/models';
import { sshActions, SSHActionsNames } from '../components/ssh-service/redux/actions';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { VMIKind, VMKind } from '@console/kubevirt-plugin/src/types';
import { useActiveNamespace } from '@console/shared';

const AUTHORIZED_SSH_KEYS = 'authorized-ssh-keys';
type SSHReduxStructure = {
  key: string | null;
};

export const useSSHKeys = (vm?: VMIKind | VMKind) => {
  const dispatch = useDispatch();
  const { metadata } = vm || {};
  const [tempKeyBeforeUpdate, setTempKeyBeforeUpdate] = React.useState<string>();
  const [activeNamespace] = useActiveNamespace();
  const namespace = activeNamespace || metadata?.namespace;
  const { key } = useSelector(
    (state: RootStateOrAny): SSHReduxStructure => ({
      key: atob(state?.plugins?.kubevirt?.authorizedSSHKeys?.globalKeys?.[namespace] || ''),
    }),
  );
  const [secret, isSecretLoaded, secretLoadingError] = useK8sWatchResource<SecretKind>({
    kind: SecretModel.kind,
    name: AUTHORIZED_SSH_KEYS,
    namespace,
  });

  const saveOrUpdateSecret = React.useCallback(
    async (keyValue) => {
      try {
        await k8sCreate(SecretModel, {
          kind: SecretModel.kind,
          apiVersion: SecretModel.apiVersion,
          metadata: {
            name: AUTHORIZED_SSH_KEYS,
            namespace,
          },
          data: { key: btoa(keyValue) },
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e.message);
      }
    },
    [namespace],
  );

  const updateSSHKey = React.useCallback(
    (sshKey?: string) => {
      dispatch(sshActions[SSHActionsNames.updateKey](namespace, sshKey));
    },
    [dispatch, namespace],
  );

  React.useEffect(() => {
    updateSSHKey(secret?.data?.key);
  }, [secret, isSecretLoaded, updateSSHKey]);

  return {
    key,
    isSecretLoaded,
    secretLoadingError,
    updateSSHKey,
    saveOrUpdateSecret,
    tempKeyBeforeUpdate,
    setTempKeyBeforeUpdate,
  };
};
