import React from 'react';

import {coFetchJSON} from '../../co-fetch';
import {NavTitle, DocumentationSidebar} from '../utils';
import {register} from '../react-wrapper';
import {ClusterUpdates} from '../cluster-updates/cluster-updates';
import {LicenseSetting} from './license-setting';
import {LDAPSetting} from './ldap';
import {SafetyFirst} from '../safety-first';
import {FLAGS, connectToFlags} from '../../features';

export const SettingsRow = ({children}) => <div className="row co-m-form-row">{children}</div>;
export const SettingsLabel = ({children}) => <div className="col-sm-4 col-md-3"><label>{children}</label></div>;
export const SettingsContent = ({children}) => <div className="col-sm-8 col-md-9">{children}</div>;

const ClusterSettingsPage = connectToFlags(FLAGS.CLUSTER_UPDATES)(
class ClusterSettingsPage_ extends SafetyFirst {
  componentDidMount() {
    super.componentDidMount();
    coFetchJSON('version').then(version => this.setState({version}));
  }

  render() {
    const { version } = (this.state || {});
    const { CLUSTER_UPDATES } = this.props.flags;
    return <div className="co-p-cluster">
      <div className="co-p-cluster__body">
        <NavTitle title="Cluster Settings" />
        { CLUSTER_UPDATES &&
          <div>
            {/*TODO: nesting inside an extra <div> to get rid of the bottom border...*/}
            <div className="co-m-pane__body">
              <p className="co-m-message co-m-message--error co-cluster-updates-warning">Warning: Experimental feature. Only use on clusters that can be easily replaced, or if you have a current backup of etcd.</p>
              <ClusterUpdates />
            </div>
          </div>
        }
        <div className="co-m-pane__body">
          <h1 className="co-p-cluster--heading">General</h1>
          <LicenseSetting />
          <LDAPSetting />
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
      <DocumentationSidebar version={version} />
    </div>;
  }
});

register('ClusterSettingsPage', ClusterSettingsPage);
