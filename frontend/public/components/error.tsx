import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

import { ErrorBoundaryFallbackProps } from '@console/shared/src/components/error/error-boundary';
import { CopyToClipboard, getQueryArgument, PageHeading, ExpandCollapse } from './utils';

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
      <PageHeading detail={true} title={t('public~Error')} />
      <div className="co-m-pane__body" data-test-id="error-page">
        <h1 className="co-m-pane__heading co-m-pane__heading--center">{title}</h1>
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

export const ErrorBoundaryFallback: React.SFC<ErrorBoundaryFallbackProps> = (props) => {
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <h1 className="co-m-pane__heading co-m-pane__heading--center">
        {t('public~Oh no! Something went wrong.')}
      </h1>
      <ExpandCollapse
        textCollapsed={t('public~Show details')}
        textExpanded={t('public~Hide details')}
      >
        <h3 className="co-section-heading-tertiary">{props.title}</h3>
        <div className="form-group">
          <label htmlFor="description">{t('public~Description:')}</label>
          <p>{props.errorMessage}</p>
        </div>
        <div className="form-group">
          <label htmlFor="componentTrace">{t('public~Component trace:')}</label>
          <div className="co-copy-to-clipboard__stacktrace-width-height">
            <CopyToClipboard value={props.componentStack.trim()} />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="stackTrace">{t('public~Stack trace:')}</label>
          <div className="co-copy-to-clipboard__stacktrace-width-height">
            <CopyToClipboard value={props.stack.trim()} />
          </div>
        </div>
      </ExpandCollapse>
    </div>
  );
};

export type ErrorComponentProps = {
  title: string;
  message?: string;
};

export type ErrorPageProps = {};
export type ErrorPage404Props = Omit<ErrorComponentProps, 'title'>;
