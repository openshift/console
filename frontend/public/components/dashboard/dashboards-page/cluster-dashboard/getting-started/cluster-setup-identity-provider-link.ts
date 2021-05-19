import { useTranslation } from 'react-i18next';

import { GettingStartedLink } from '@console/shared/src/components/getting-started';

import { OAuthModel } from '@console/internal/models';
import { OAuthKind, referenceForModel } from '@console/internal/module/k8s';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

const useCanEditIdentityProviders = () =>
  useAccessReview({
    group: OAuthModel.apiGroup,
    resource: OAuthModel.plural,
    name: 'cluster',
    verb: 'patch',
  });

const useOAuthData = (canEdit: boolean) =>
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

export const useIdentityProviderLink = (): GettingStartedLink | null => {
  const { t } = useTranslation();
  const canEdit = useCanEditIdentityProviders();
  const [oauthData, oauthLoaded, oauthLoadError] = useOAuthData(canEdit);

  if (!canEdit || !oauthData || !oauthLoaded || oauthLoadError) {
    return null;
  }

  const hasIdentityProviders = oauthData.spec?.identityProviders?.length > 0;
  if (hasIdentityProviders) {
    return null;
  }

  return {
    key: 'identity-providers',
    title: t('public~Add identity providers'),
    href: resourcePathFromModel(OAuthModel, 'cluster'),
  };
};
