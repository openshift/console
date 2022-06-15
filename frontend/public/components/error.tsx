import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import i18next from 'i18next';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { global_danger_color_100 as globalDangerColor100 } from '@patternfly/react-tokens';

import { getQueryArgument, PageHeading } from './utils';

const getMessage = (type: string, id: string): string => {
  // User messages for error_types returned in auth.go
  const messages = {
    auth: {
      /* eslint-disable camelcase */
      oauth_error: i18next.t('public~There was an error generating OAuth client from OIDC client.'),
      login_state_error: i18next.t('public~There was an error generating login state.'),
      cookie_error: i18next.t('public~There was an error setting login state cookie'),
      missing_code: i18next.t('public~Auth code is missing in query param.'),
      missing_state: i18next.t('public~There was an error parsing your state cookie'),
      invalid_code: i18next.t(
        'public~There was an error logging you in. Please log out and try again.',
      ),
      invalid_state: i18next.t(
        'public~There was an error verifying your session. Please log out and try again.',
      ),
      logout_error: i18next.t('public~There was an error logging you out. Please try again.'),
      /* eslint-enable camelcase */
      default: i18next.t(
        'public~There was an authentication error with the system. Please try again or contact support.',
      ),
    },
  };

  return _.get(messages, `${type}.${id}`) || _.get(messages, `${type}.default`) || '';
};
const urlMessage = () => {
  const type = getQueryArgument('error_type');
  const error = getQueryArgument('error');
  return type && error ? getMessage(type, error) : '';
};

const ErrorComponent: React.SFC<ErrorComponentProps> = ({ title, message }) => {
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

export const ErrorPage: React.SFC<ErrorPageProps> = () => {
  const { t } = useTranslation();
  return (
    <div>
      <Helmet>
        <title>{t('public~Error')}</title>
      </Helmet>
      <ErrorComponent title={t('public~Oh no! Something went wrong.')} message={urlMessage()} />
    </div>
  );
};

export const ErrorPage404: React.SFC<ErrorPage404Props> = (props) => {
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

export type ErrorPageProps = {};
export type ErrorPage404Props = Omit<ErrorComponentProps, 'title'>;

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
            <Trans t={t} ns="public">
              If the problem persists, contact{' '}
              <a href="https://access.redhat.com/support">Red Hat Support</a> or check our{' '}
              <a href="https://status.redhat.com">status page</a> for known outages.
            </Trans>
          </StackItem>
        </Stack>
      </EmptyStateBody>
    </EmptyState>
  );
};
