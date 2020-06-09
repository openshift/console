import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';

import { ErrorBoundaryFallbackProps } from '@console/shared/src/components/error/error-boundary';
import { CopyToClipboard, getQueryArgument, PageHeading, ExpandCollapse } from './utils';

// User messages for error_types returned in auth.go
const messages = {
  auth: {
    /* eslint-disable camelcase */
    oauth_error: 'There was an error generating OAuth client from OIDC client.',
    login_state_error: 'There was an error generating login state.',
    cookie_error: 'There was an error setting login state cookie',
    missing_code: 'Auth code is missing in query param.',
    missing_state: 'There was an error parsing your state cookie',
    invalid_code: 'There was an error logging you in. Please log out and try again.',
    invalid_state: 'There was an error verifying your session. Please log out and try again.',
    logout_error: 'There was an error logging you out. Please try again.',
    /* eslint-enable camelcase */
    default:
      'There was an authentication error with the system. Please try again or contact support.',
  },
};

const getMessage = (type, id) =>
  _.get(messages, `${type}.${id}`) || _.get(messages, `${type}.default`) || '';
const urlMessage = () => {
  const type = getQueryArgument('error_type');
  const error = getQueryArgument('error');
  return type && error ? getMessage(type, error) : '';
};

const ErrorComponent: React.SFC<ErrorComponentProps> = ({ title, message }) => (
  <>
    <PageHeading detail={true} title="Error" />
    <div className="co-m-pane__body" data-test-id="error-page">
      <h1 className="co-m-pane__heading co-m-pane__heading--center">{title}</h1>
      {message && <div className="text-center">{message}</div>}
    </div>
  </>
);

export const ErrorPage: React.SFC<ErrorPageProps> = () => (
  <div>
    <Helmet>
      <title>Error</title>
    </Helmet>
    <ErrorComponent title="Oh no! Something went wrong." message={urlMessage()} />
  </div>
);

export const ErrorPage404: React.SFC<ErrorPage404Props> = (props) => (
  <div>
    <Helmet>
      <title>Page Not Found (404)</title>
    </Helmet>
    <ErrorComponent title="404: Page Not Found" message={props.message} />
  </div>
);

export const ErrorBoundaryFallback: React.SFC<ErrorBoundaryFallbackProps> = (props) => (
  <div className="co-m-pane__body">
    <h1 className="co-m-pane__heading co-m-pane__heading--center">Oh no! Something went wrong.</h1>
    <ExpandCollapse textCollapsed="Show Details" textExpanded="Hide Details">
      <h3 className="co-section-heading-tertiary">{props.title}</h3>
      <div className="form-group">
        <label htmlFor="description">Description: </label>
        <p>{props.errorMessage}</p>
      </div>
      <div className="form-group">
        <label htmlFor="componentTrace">Component Trace: </label>
        <div className="co-copy-to-clipboard__stacktrace-width-height">
          <CopyToClipboard value={props.componentStack.trim()} />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="stackTrace">Stack Trace: </label>
        <div className="co-copy-to-clipboard__stacktrace-width-height">
          <CopyToClipboard value={props.stack.trim()} />
        </div>
      </div>
    </ExpandCollapse>
  </div>
);

export type ErrorComponentProps = {
  title: string;
  message?: string;
};

export type ErrorPageProps = {};
export type ErrorPage404Props = Omit<ErrorComponentProps, 'title'>;
