import React from 'react';

import {coFetchJSON} from '../../co-fetch';
import {NavTitle} from '../utils';
import {angulars, register} from '../react-wrapper';
import {ClusterUpdates} from '../cluster-updates/cluster-updates';
import {LicenseSetting} from './license-setting';

export const SettingsRow = ({children}) => <div className="row co-m-form-row">{children}</div>;
export const SettingsLabel = ({children}) => <div className="col-sm-4 col-md-3"><label>{children}</label></div>;
export const SettingsContent = ({children}) => <div className="col-sm-8 col-md-9">{children}</div>;

const featureCheckInterval = 200;
const featureCheckTimeout = 15 * 1000;

class ClusterSettingsPage extends React.Component {
  constructor(props) {
    super(props);
    this._featureCheckCount = 0;
    this._featureCheckInterval = null;
    this._isMounted = false;
    this.state = {
      clusterUpdatesEnabled: false,
      version: null
    };
  }

  componentDidMount() {
    this._isMounted = true;
    this._featureCheckInterval = setInterval(this._checkFeatures.bind(this), featureCheckInterval);
    this._checkVersion();
  }

  componentWillUnmount() {
    this._isMounted = false;
    clearInterval(this._featureCheckInterval);
  }

  _checkFeatures() {
    const flag = angulars.FEATURE_FLAGS.clusterUpdates;
    if (typeof flag !== 'undefined') {
      this.setState({
        clusterUpdatesEnabled: flag
      });
      clearInterval(this._featureCheckInterval);
    }

    if (this._featureCheckCount >= featureCheckTimeout / featureCheckInterval) {
      clearInterval(this._featureCheckInterval);
      return;
    }
    this._featureCheckCount += 1;
  }

  _checkVersion() {
    coFetchJSON('version').then((data) => this.setState({version: data}));
  }

  render() {
    return <div className="co-p-cluster">
      <div className="co-p-cluster__body">
        <NavTitle title="Cluster Settings" />
        { this.state.clusterUpdatesEnabled &&
          <div>
            {/*TODO: nesting inside an extra <div> to get rid of the bottom border...*/}
            <div className="co-m-pane__body">
              <ClusterUpdates />
            </div>
          </div>
        }
        <div className="co-m-pane__body">
          <h1 className="co-p-cluster--heading">General</h1>
          <LicenseSetting />
        </div>
        {/*<div className="co-m-pane__body">
          <h1 className="co-p-cluster--heading">Tectonic Console</h1>
          <p>Console is how you and your users interact with your Tectonic cluster and view the status and health of your applications.</p>
        </div>
        <div className="co-m-pane__body">
          <h1 className="co-p-cluster--heading">Tectonic Identity</h1>
          <p>Identity is the Tectonic component that manages user accounts, resetting password, etc. Delegation to other authentication systems, such as Google OAUTH or a corporate LDAP environment is supported.</p>
        </div>*/}
      </div>
      <div className="co-p-cluster__sidebar">
        <div className="co-m-pane__body">
          <h1 className="co-p-cluster__sidebar-heading co-p-cluster__sidebar-heading--first">Documentation</h1>
          <dl>
            <dt className="co-p-cluster__doc-title"><a href="https://tectonic.com/enterprise/docs/latest/account/" target="_blank">Manage Your Account</a></dt>
            <dd className="co-p-cluster__doc-description">You can manage your Tectonic account at <a href="https://account.tectonic.com" target="_blank">account.tectonic.com</a> for access to licenses, billing details, invoices, and account users.</dd>
            <dt className="co-p-cluster__doc-title"><a href="https://tectonic.com/enterprise/docs/latest/usage/" target="_blank">End User Guide</a></dt>
            <dd className="co-p-cluster__doc-description">End-users of Tectonic are expected to deploy applications directly in Kubernetes. Your application's architecture will drive how you assemble these components together.</dd>
          </dl>
          <h1 className="co-p-cluster__sidebar-heading">Additional Support</h1>
          <p><a href="https://tectonic.com/docs/" target="_blank" className="co-p-cluster__sidebar-link"><span className="fa fa-book co-p-cluster__sidebar-link-icon"></span>Full Documentation</a></p>
          { this.state.version && this.state.version.entitlementKind === 'nodes' && <p><a href="https://github.com/coreos/tectonic-forum" target="_blank" className="co-p-cluster__sidebar-link"><span className="fa fa-comments-o co-p-cluster__sidebar-link-icon"></span>Tectonic Forum</a></p> }
          { this.state.version && this.state.version.entitlementKind === 'nodes' && <p><a href="mailto:tectonic-feedback@coreos.com" className="co-p-cluster__sidebar-link"><span className="fa fa-envelope-o co-p-cluster__sidebar-link-icon"></span>tectonic-feedback@coreos.com</a></p> }
        </div>
      </div>
    </div>;
  }
}

register('ClusterSettingsPage', ClusterSettingsPage);
