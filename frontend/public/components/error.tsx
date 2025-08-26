import * as React from 'react';
import { useLocation } from 'react-router';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { ButtonLink } from '@console/shared/src/components/links/ButtonLink';
import {
  ErrorState as PfErrorState,
  ErrorStateProps as PfErrorStateProps,
  NotFoundIcon,
} from '@patternfly/react-component-groups';
import { Trans, useTranslation } from 'react-i18next';
import { CodeBlock, CodeBlockCode, Stack, StackItem } from '@patternfly/react-core';
import { useFavoritesOptions } from './useFavoritesOptions';

export const ErrorPage404: React.FC<PfErrorStateProps> = (props) => {
  const { t } = useTranslation();
  const location = useLocation();

  const [favorites, , loaded] = useFavoritesOptions();

  const currentPath = location?.pathname;
  const queryParams = new URLSearchParams(location?.search);
  const fromFavorites = queryParams.get('from') === 'favorites';

  const isDeletedFavorite =
    fromFavorites && loaded && favorites?.some((fav) => fav.url === currentPath);

  return (
    <>
      <DocumentTitle>{t('public~Page Not Found (404)')}</DocumentTitle>
      <PfErrorState
        status="none"
        icon={NotFoundIcon}
        headingLevel="h1"
        titleText={t('public~404: Page Not Found')}
        defaultBodyText={
          <>
            {t("public~We couldn't find that page.")}
            {isDeletedFavorite && (
              <p>
                {t(
                  'public~If you would like to remove it from your favorites list, unfavorite it.',
                )}
              </p>
            )}
          </>
        }
        customFooter={
          <ButtonLink variant="link" href="/">
            {t('public~Return to homepage')}
          </ButtonLink>
        }
        {...props}
      />
    </>
  );
};

const ErrorStateMessage = () => (
  <Trans ns="public">
    If the problem persists, contact a cluster administrator,{' '}
    <a href="https://access.redhat.com/support">Red Hat Support</a> or check our{' '}
    <a href="https://status.redhat.com">status page</a> for known outages.
  </Trans>
);

export const ErrorState: React.FC = () => {
  const { t } = useTranslation();

  return (
    <PfErrorState
      titleText={t('public~An error occured')}
      headingLevel="h1"
      bodyText={
        <Stack>
          <StackItem>
            {t('public~There was a problem processing the request. Please try again.')}
          </StackItem>
          <StackItem>
            <ErrorStateMessage />
          </StackItem>
        </Stack>
      }
    />
  );
};

const LoginErrorMessage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const urlSearchParams = new URLSearchParams(location.search);
  const errorType = urlSearchParams.get('error_type');
  const error = urlSearchParams.get('error');
  switch (errorType) {
    case 'oauth_error':
      return t('public~There was an error generating OAuth client from OIDC client.');
    case 'login_state_error':
      return t('public~There was an error generating login state.');
    case 'cookie_error':
      return t('public~There was an error setting login state cookie');
    case 'logout_error':
      return t('public~There was an error logging you out. Please try again.');
    case 'auth':
      // When the error type is set as auth
      switch (error) {
        case 'missing_state':
          return t('public~There was an error parsing your state cookie');
        case 'invalid_state':
          return t(
            'public~There was an error verifying your session. Please log out and try again.',
          );
        case 'missing_code':
          return t('public~Auth code is missing in query param.');
        case 'invalid_code':
          return t('public~There was an error logging you in. Please log out and try again.');
        default:
          return t('public~There was an authentication error. Please log out and try again.');
      }
    default:
      return (
        <Trans ns="public">
          There was an authentication error with the system:
          <CodeBlock>
            <CodeBlockCode>{error}</CodeBlockCode>
          </CodeBlock>
        </Trans>
      );
  }
};

export const AuthenticationErrorPage: React.FC = () => {
  const { t } = useTranslation();
  const title = t('public~Authentication error');

  // Set document title manually to avoid Helmet issues
  React.useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <PfErrorState
      headingLevel="h1"
      titleText={title}
      bodyText={
        <Stack>
          <StackItem>
            <LoginErrorMessage />
          </StackItem>
          <StackItem>
            <ErrorStateMessage />
          </StackItem>
        </Stack>
      }
      customFooter={
        <ButtonLink variant="primary" href="/logout">
          {t('public~Try again')}
        </ButtonLink>
      }
    />
  );
};
