import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import {
  CodeBlock,
  CodeBlockCode,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateSecondaryActions,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { global_danger_color_100 as globalDangerColor100 } from '@patternfly/react-tokens';
import { PageHeading } from './utils';
import { useLocation } from 'react-router';

const ErrorComponent: React.FC<ErrorComponentProps> = ({ title, message }) => {
  const { t } = useTranslation();
  return (
    <>
      <PageHeading title={t('public~Error')} detail />
      <div className="co-m-pane__body" data-test-id="error-page">
        <PageHeading title={title} centerText />
        {message && <div className="pf-u-text-align-center">{message}</div>}
      </div>
    </>
  );
};

export const ErrorPage404: React.FC<ErrorPage404Props> = (props) => {
  const { t } = useTranslation();
  return (
    <div>
      <Helmet>
        <title>{t('public~Page Not Found (404)')}</title>
      </Helmet>
      <ErrorComponent title={t('public~404: Page Not Found')} message={props.message} />
    </div>
  );
};

export type ErrorComponentProps = {
  title: string;
  message?: string;
};

export type ErrorPage404Props = Omit<ErrorComponentProps, 'title'>;

const ErrorStateMessage = () => (
  <Trans ns="public">
    If the problem persists, contact a cluster administrator,{' '}
    <a href="https://access.redhat.com/support">Red Hat Support</a> or check our{' '}
    <a href="https://status.redhat.com">status page</a> for known outages.
  </Trans>
);

export const ErrorState: React.FC = () => {
  const { t } = useTranslation();
  const DangerIcon = () => <ExclamationCircleIcon color={globalDangerColor100.value} size="sm" />;
  return (
    <EmptyState variant="xs">
      <EmptyStateIcon variant="container" component={DangerIcon} />
      <Title headingLevel="h6">{t('public~Something went wrong')}</Title>
      <EmptyStateBody>
        <Stack>
          <StackItem>
            {t('public~There was a problem processing the request. Please try again.')}
          </StackItem>
          <StackItem>
            <ErrorStateMessage />
          </StackItem>
        </Stack>
      </EmptyStateBody>
    </EmptyState>
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
    case 'missing_code':
      return t('public~Auth code is missing in query param.');
    case 'missing_state':
      return t('public~There was an error parsing your state cookie');
    case 'invalid_code':
      return t('public~There was an error logging you in. Please log out and try again.');
    case 'invalid_state':
      return t('public~There was an error verifying your session. Please log out and try again.');
    case 'logout_error':
      return t('public~There was an error logging you out. Please try again.');
    default:
      return (
        <Trans>
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
  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <EmptyState>
        <EmptyStateIcon icon={ExclamationCircleIcon} />
        <Title headingLevel="h1">{title}</Title>
        <EmptyStateBody>
          <Stack>
            <StackItem>
              <LoginErrorMessage />
            </StackItem>
            <StackItem>
              <ErrorStateMessage />
            </StackItem>
          </Stack>
        </EmptyStateBody>
        <EmptyStateSecondaryActions>
          <a href="/logout">{t('public~Try again')}</a>
        </EmptyStateSecondaryActions>
      </EmptyState>
    </>
  );
};
