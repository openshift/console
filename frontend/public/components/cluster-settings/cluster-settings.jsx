import React from 'react';
import Helmet from 'react-helmet';

import {coFetchJSON} from '../../co-fetch';
import {NavTitle, DocumentationSidebar} from '../utils';
import {ClusterUpdates} from '../cluster-updates/cluster-updates';
import {LicenseSetting} from './license-setting';
import {LDAPSetting} from './ldap';
import {CertsInfoContainer} from './certs-info';
import {SafetyFirst} from '../safety-first';
import {FLAGS, connectToFlags} from '../../features';

export const SettingsRow = ({children}) => <div className="row co-m-form-row">{children}</div>;
export const SettingsLabel = ({children}) => <div className="col-sm-4 col-md-3"><label>{children}</label></div>;
export const SettingsContent = ({children}) => <div className="col-sm-8 col-md-9">{children}</div>;

export const ClusterSettingsPage = connectToFlags(FLAGS.CLUSTER_UPDATES)(
class ClusterSettingsPage_ extends SafetyFirst {
  componentDidMount() {
    super.componentDidMount();
    coFetchJSON('version').then(version => this.setState({version}));
  }

  render() {
    const { version } = (this.state || {});
    const { CLUSTER_UPDATES } = this.props.flags;
    return <div className="co-p-cluster">
      <Helmet title="Cluster" />
      <div className="co-p-cluster__body">
        <NavTitle title="Cluster Settings" />
        { CLUSTER_UPDATES &&
          <div>
            {/*TODO: nesting inside an extra <div> to get rid of the bottom border...*/}
            <div className="co-m-pane__body">
              <p className="alert alert-info co-cluster-updates-warning">Warning: Experimental feature. Only use on clusters that can be easily replaced, or if you have a current backup of etcd.</p>
              <ClusterUpdates />
            </div>
          </div>
        }
        <div className="co-m-pane__body">
          <h1 className="co-p-cluster--heading">General</h1>
          <LicenseSetting />
          <LDAPSetting />
          <CertsInfoContainer />
        </div>
      </div>
      <DocumentationSidebar version={version} />
    </div>;
  }
});
