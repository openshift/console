import React from 'react';

import {getMessage} from '../module/service/message.js';
import {angulars, register} from './react-wrapper';
import {NavTitle} from './utils';

const urlMessage = () => {
  const {error_type: type, error} = angulars.routeParams;
  return (type && error) ? getMessage(type, error) : '';
};

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

export const ErrorPage = () => <Error title="Oh no! Something went wrong." message={urlMessage()} />;
register('ErrorPage', ErrorPage);

export const ErrorPage404 = () => <Error title="404: Page Not Found" />;
register('ErrorPage404', ErrorPage404);
