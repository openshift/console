import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { OAuthModel } from '@console/internal/models';
import type { OAuthKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { isClusterExternallyManaged } from './useCanClusterUpgrade';

export const useCanEditIdentityProviders = () => {
  const canPatchOAuth = useAccessReview({
    group: OAuthModel.apiGroup,
    resource: OAuthModel.plural,
    name: 'cluster',
    verb: 'patch',
  });
  // Identity providers for externally managed clusters are configured outside the cluster, so the in-cluster OAuth resource is not the source of truth.
  return canPatchOAuth && !isClusterExternallyManaged();
};

export const useOAuthData = (canEdit: boolean) =>
  useK8sWatchResource<OAuthKind>(
    canEdit
      ? {
          kind: referenceForModel(OAuthModel),
          isList: false,
          namespaced: false,
          name: 'cluster',
        }
      : null,
  );
