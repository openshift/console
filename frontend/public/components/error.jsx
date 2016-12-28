import React from 'react';

import {register} from './react-wrapper';
import {NavTitle} from './utils';

export const ErrorPage404 = () => <div className="co-p-error-404">
  <NavTitle detail={true} title="Error" />
  <div className="co-m-pane">
    <div className="co-m-pane__heading">
      <h1 className="co-m-pane__title text-center">404: Page Not Found</h1>
    </div>
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-sm-12 co-error-bg-img"></div>
      </div>
    </div>
  </div>
</div>;

register('ErrorPage404', ErrorPage404);
