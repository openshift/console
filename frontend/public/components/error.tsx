/* eslint-disable no-unused-vars, no-undef */
import * as _ from 'lodash-es';
import * as React from 'react';
import { ExpandCollapse } from 'patternfly-react';
import { Helmet } from 'react-helmet';

import { getQueryArgument, PageHeading } from './utils';

// User messages for error_types returned in auth.go
const messages = {
  auth: {
    'oauth_error': 'There was an error generating OAuth client from OIDC client.',
    'login_state_error': 'There was an error generating login state.',
    'cookie_error': 'There was an error setting login state cookie',
    'missing_code': 'Auth code is missing in query param.',
    'missing_state': 'There was an error parsing your state cookie',
    'invalid_code': 'There was an error logging you in. Please log out and try again.',
    'invalid_state': 'There was an error verifying your session. Please log out and try again.',
    'default': 'There was an authentication error with the system. Please try again or contact support.',
    'logout_error': 'There was an error logging you out. Please try again.',
  },
};

const getMessage = (type, id) => _.get(messages, `${type}.${id}`) || _.get(messages, `${type}.default`) || '';
const urlMessage = () => {
  const type = getQueryArgument('error_type');
  const error = getQueryArgument('error');
  return (type && error) ? getMessage(type, error) : '';
};
const getErrMessage = () => {
  const msg = getQueryArgument('error_msg');
  if (msg) {
    try {
      return decodeURIComponent(msg);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }
  return '';
};

const ErrorComponent: React.SFC<ErrorComponentProps> = ({title, message, errMessage}) => <React.Fragment>
  <PageHeading detail={true} title="Error" />
  <div className="co-m-pane__body">
    <h1 className="co-m-pane__heading co-m-pane__heading--center">{title}</h1>
    {message && <div className="text-center">{message}</div>}
    {errMessage && <div className="text-center text-muted">{errMessage}</div>}
  </div>
</React.Fragment>;

export const ErrorPage: React.SFC<ErrorPageProps> = () => <div>
  <Helmet>
    <title>Error</title>
  </Helmet>
  <ErrorComponent title="Oh no! Something went wrong." message={urlMessage()} errMessage={getErrMessage()} />
</div>;

export const ErrorPage404: React.SFC<ErrorPage404Props> = (props) => <div>
  <Helmet>
    <title>Page Not Found (404)</title>
  </Helmet>
  <ErrorComponent title="404: Page Not Found" message={props.message} errMessage={props.errMessage} />
</div>;

export const ErrorBoundaryFallbackComponent: React.SFC<ErrorBoundaryFallbackComponentProps> = (props) =>
  <div className="co-m-pane__body">
    <h1 className="co-m-pane__heading co-m-pane__heading--center">Oh no! Something went wrong.</h1>
    <ExpandCollapse textCollapsed="Show error details..." textExpanded="Hide error details..." bordered={false}>
      <h3 className="co-section-heading-tertiary">{props.title}</h3>
      <div>
        <strong>Description: </strong>
        {props.errorMessage}
      </div>
      <div className="text-muted">
        <strong>Component Trace: </strong>
        {props.componentStack}
      </div>
      <div className="text-muted">
        <strong>Stack Trace: </strong>
        {props.stack}
      </div>
    </ExpandCollapse>
  </div>;

export type ErrorComponentProps = {
  title: string;
  message?: string;
  errMessage?: string;
};

export type ErrorPageProps = {};
export type ErrorPage404Props = Omit<ErrorComponentProps, 'title'>;
export type ErrorBoundaryFallbackComponentProps = {
  errorMessage: string;
  componentStack: string;
  stack: string;
  title: string;
};
