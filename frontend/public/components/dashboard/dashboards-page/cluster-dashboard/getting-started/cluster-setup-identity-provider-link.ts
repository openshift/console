import { useTranslation } from 'react-i18next';

import { GettingStartedLink } from '@console/shared/src/components/getting-started';

import { OAuthModel } from '@console/internal/models';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { useCanEditIdentityProviders, useOAuthData } from '@console/shared/src/hooks/oauth';

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
    id: 'identity-providers',
    title: t('public~Add identity providers'),
    href: resourcePathFromModel(OAuthModel, 'cluster'),
  };
};
