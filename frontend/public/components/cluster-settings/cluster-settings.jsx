import React from 'react';

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
    this.state = {
      clusterUpdatesEnabled: false
    };
  }

  componentDidMount() {
    this._featureCheckInterval = setInterval(this._checkFeatures.bind(this), featureCheckInterval);
  }

  componentWillUnmount() {
    clearInterval(this._featureCheckInterval);
  }

  _checkFeatures() {
    const flag = angulars.FEATURE_FLAGS.clusterUpdates;
    if (typeof flag !== 'undefined') {
      clearInterval(this._featureCheckInterval);
      this.setState({
        clusterUpdatesEnabled: flag
      });
    }

    if (this._featureCheckCount >= featureCheckTimeout / featureCheckInterval) {
      clearInterval(this._featureCheckInterval);
      return;
    }
    this._featureCheckCount += 1;
  }

  render() {
    return <div className="co-p-cluster">
      <div className="co-p-cluster__body">
        <NavTitle title="Cluster Settings" />
        { this.state.clusterUpdatesEnabled &&
          <div>
            {/*TODO: nesting inside an extra <div> to get rid of the bottom border...*/}
            <div className="co-m-pane__body">
              <p className="co-m-message co-m-message--error co-cluster-updates-warning">Warning: Experimental feature. Only use on clusters that can be easily replaced, or if you have current a backup of etcd.</p>
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
      {/*<div className="co-p-cluster__sidebar">
        <div className="co-m-pane__body">
          <h1 className="co-p-cluster__sidebar-heading co-p-cluster__sidebar-heading--first">Documentation</h1>
          <dl>
            <dt className="co-p-cluster__doc-title"><a href="#">Cluster Achritectures</a></dt>
            <dd className="co-p-cluster__doc-description">Common examples for deploying a cluster of CoreOS machines on the cloud or bare metal.</dd>
            <dt className="co-p-cluster__doc-title"><a href="#">Installing Tectonic Services with kubectl</a></dt>
            <dd className="co-p-cluster__doc-description">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laundantium</dd>
            <dt className="co-p-cluster__doc-title"><a href="#">Upgrading your Cluster</a></dt>
            <dd className="co-p-cluster__doc-description">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laundantium</dd>
          </dl>
          <h1 className="co-p-cluster__sidebar-heading">Export/Backup</h1>
          <p>Tectonic configurations can be backed up at any time.</p>
          <p><a href="#" className="co-p-cluster__sidebar-link"><span className="fa fa-download co-p-cluster__sidebar-link-icon"></span>Export Configuration</a></p>
        </div>
      </div>*/}
    </div>;
  }
}

register('ClusterSettingsPage', ClusterSettingsPage);
