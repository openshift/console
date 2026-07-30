import { useTranslation } from 'react-i18next';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { OAuthModel } from '@console/internal/models';
import type { GettingStartedLink } from '@console/shared/src/components/getting-started/GettingStartedCard';
import { useCanEditIdentityProviders, useOAuthData } from '@console/shared/src/hooks/oauth';

export const useIdentityProviderLink = (): GettingStartedLink | null => {
  const { t } = useTranslation('public');
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
    title: t('Add identity providers'),
    href: resourcePathFromModel(OAuthModel, 'cluster'),
  };
};
