import React from 'react';
import Helmet from 'react-helmet';

import {NavTitle} from './utils';

const messages = {
  auth: {
    'invalid_code': 'There was an error logging you in. Please log out and try again.',
    'default': 'There was an authentication error with the system. Please try again or contact support.',
    'logout_error': 'There was an error logging you out. Please try again.',
  },
};

const getMessage = (type, id) => _.get(messages, `${type}.${id}`) || _.get(messages, `${type}.default`) || '';
const urlMessage = ({error_type: type, error}) => (type && error) ? getMessage(type, error) : '';

const Error = ({title, message}) => <div>
  <NavTitle detail={true} title="Error" />
  <div className="co-m-pane">
    <div className="co-m-pane__heading">
      <h1 className="co-m-pane__title text-center">{title}</h1>
    </div>
    <div className="co-m-pane__body">
      {message && <div className="row">
        <div className="col-sm-12 text-center">{message}</div>
      </div>}
      <div className="row">
        <div className="col-sm-12 co-error-bg-img"></div>
      </div>
    </div>
  </div>
</div>;

export const ErrorPage = ({location}) => <div>
  <Helmet title="Error" />
  <Error title="Oh no! Something went wrong." message={urlMessage(location.query)} />
</div>;

export const ErrorPage404 = () => <div>
  <Helmet title="Page Not Found (404)" />
  <Error title="404: Page Not Found" />
</div>;
