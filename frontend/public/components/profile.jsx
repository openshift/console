import React from 'react';
import Helmet from 'react-helmet';

import {authSvc} from '../module/auth';
import {kubectlConfigModal} from './modals';
import {NavTitle} from './utils';
import {ClientTokensContainer} from './client-tokens';

export const ProfilePage = () => <div className="co-p-profile">
  <Helmet title="Profile" />
  <NavTitle detail={true} title="Profile" />
  <div className="co-m-pane">
    <div className="co-m-pane__body">
      <div className="co-m-pane__body-section--bordered">
        <dl>
          <dt>Name</dt>
          <dd>{authSvc.name() || '-'}</dd>
          <dt>Email Address</dt>
          <dd>{authSvc.email() || '-'}</dd>
          <dt>kubectl</dt>
          <dd><button className="btn btn-default" type="button" onClick={() => kubectlConfigModal()}>Download Configuration</button></dd>
        </dl>
      </div>
    </div>
    <ClientTokensContainer />
  </div>
</div>;
