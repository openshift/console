import * as React from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import { k8sCreate, k8sUpdate, SecretKind, K8sKind } from '@console/internal/module/k8s';

type useSecretArgs = {
  secretName: string;
  namespace: string;
};

export type useSecretResult = {
  secret: SecretKind;
  isSecretLoaded: boolean;
  secretLoadingError: string;
  createOrUpdateSecret: (
    keyValue: string,
    selectedNamespace: string,
    opts?: { secretName: string; create: boolean },
  ) => void;
};

const useSecret = ({ secretName, namespace }: useSecretArgs) => {
  const [secret, isSecretLoaded, secretLoadingError] = useK8sWatchResource<SecretKind>({
    kind: SecretModel.kind,
    name: secretName,
    namespace,
  });

  const createOrUpdateSecret = React.useCallback(
    async (
      secretValue: string,
      selectedNamespace: string,
      opts?: { secretName: string; create: boolean },
    ) => {
      const createOrUpdate: (kind: K8sKind, data: SecretKind) => Promise<SecretKind> = opts?.create
        ? k8sCreate
        : secret
        ? k8sUpdate
        : k8sCreate;
      try {
        await createOrUpdate(SecretModel, {
          kind: SecretModel.kind,
          apiVersion: SecretModel.apiVersion,
          metadata: {
            name: opts?.secretName || secretName,
            namespace: selectedNamespace,
          },
          data: { key: btoa(secretValue) },
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e.message);
      }
    },
    [secret, secretName],
  );

  return {
    secret,
    isSecretLoaded,
    secretLoadingError,
    createOrUpdateSecret,
  };
};

export default useSecret;
