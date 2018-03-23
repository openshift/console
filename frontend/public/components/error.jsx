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
    'invalid_code': 'There was an error logging you in. Please log out and try again.',
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
    } catch(e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }
  return '';
};

const ErrorComponent = ({title, message, errMessage}) => <div>
  <NavTitle detail={true} title="Error" />
  <div className="co-m-pane">
    <div className="co-m-pane__heading">
      <h1 className="co-m-pane__title text-center">{title}</h1>
    </div>
    <div className="co-m-pane__body">
      {message && <div className="row">
        <div className="col-sm-12 text-center">{message}</div>
      </div>}
      {errMessage && <div className="row">
        <div className="col-sm-12 text-center text-muted">{errMessage}</div>
      </div>}
      <div className="row">
        <div className="col-sm-12 co-error-bg-img"></div>
      </div>
    </div>
  </div>
</div>;

export const ErrorPage = () => <div>
  <Helmet>
    <title>Error</title>
  </Helmet>
  <ErrorComponent title="Oh no! Something went wrong." message={urlMessage()} errMessage={getErrMessage()}/>
</div>;

export const ErrorPage404 = () => <div>
  <Helmet>
    <title>Page Not Found (404)</title>
  </Helmet>
  <ErrorComponent title="404: Page Not Found" />
</div>;
