import * as React from 'react';
import { Helmet } from 'react-helmet';

import { authSvc } from '../module/auth';
import { kubectlConfigModal } from './modals';
import { NavTitle } from './utils';
import { SafetyFirst } from './safety-first';
import { ClientTokensContainer } from './client-tokens';

export class ProfilePage extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      isKubeCtlDownloaded: false
    };
    this._onKubeCtlDownloaded = this._onKubeCtlDownloaded.bind(this);
  }

  _onKubeCtlDownloaded() {
    this.setState({ isKubeCtlDownloaded: true });
  }

  render() {
    return <div className="co-p-profile">
      <Helmet>
        <title>Profile</title>
      </Helmet>
      <NavTitle detail={true} title="Profile" />
      <div className="co-m-pane__body">
        <dl className="co-m-pane__details">
          <dt>Name</dt>
          <dd>{authSvc.name() || '-'}</dd>
          <dt>Email Address</dt>
          <dd>{authSvc.email() || '-'}</dd>
          <dt>kubectl</dt>
          <dd><button className="btn btn-default" type="button" onClick={() => kubectlConfigModal({ callback: this._onKubeCtlDownloaded })}>Download Configuration</button></dd>
        </dl>
      </div>
      <ClientTokensContainer isKubeCtlDownloaded={this.state.kubectl} />
    </div>;
  }
}
