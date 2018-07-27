import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';

import {NavTitle, getQueryArgument} from './utils';

//User messages for error_types returned in auth.go
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

const ErrorComponent = ({title, message, errMessage}) => <React.Fragment>
  <NavTitle detail={true} title="Error" />
  <div className="co-m-pane__body">
    <h1 className="co-m-pane__heading co-m-pane__heading--center">{title}</h1>
    {message && <div className="text-center">{message}</div>}
    {errMessage && <div className="text-center text-muted">{errMessage}</div>}
  </div>
</React.Fragment>;

export const ErrorPage = () => <div>
  <Helmet>
    <title>Error</title>
  </Helmet>
  <ErrorComponent title="Oh no! Something went wrong." message={urlMessage()} errMessage={getErrMessage()} />
</div>;

export const ErrorPage404 = () => <div>
  <Helmet>
    <title>Page Not Found (404)</title>
  </Helmet>
  <ErrorComponent title="404: Page Not Found" />
</div>;
