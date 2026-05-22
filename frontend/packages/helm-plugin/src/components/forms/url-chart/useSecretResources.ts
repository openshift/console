import { useMemo } from 'react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';

export const useSecretResources = (namespace: string) => {
  const watchedResources = useK8sWatchResources<{
    secrets: K8sResourceKind[];
  }>({
    secrets: {
      isList: true,
      kind: SecretModel.kind,
      namespace,
      optional: true,
    },
  });

  return useMemo(
    () => [
      {
        data: watchedResources.secrets?.data,
        loaded: watchedResources.secrets?.loaded,
        loadError: watchedResources.secrets?.loadError,
        kind: SecretModel.kind,
      },
    ],
    [
      watchedResources.secrets?.data,
      watchedResources.secrets?.loaded,
      watchedResources.secrets?.loadError,
    ],
  );
};
