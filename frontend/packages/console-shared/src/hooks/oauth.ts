import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { OAuthModel } from '@console/internal/models';
import { OAuthKind, referenceForModel } from '@console/internal/module/k8s';

export const useCanEditIdentityProviders = () =>
  useAccessReview({
    group: OAuthModel.apiGroup,
    resource: OAuthModel.plural,
    name: 'cluster',
    verb: 'patch',
  });

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
