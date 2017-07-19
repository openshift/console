import React from 'react';
import Helmet from 'react-helmet';

import {coFetchJSON} from '../../co-fetch';
import {NavTitle, DocumentationSidebar} from '../utils';
import {LicenseSetting} from './license-setting';
import {LDAPSetting} from './ldap';
import {CertsInfoContainer} from './certs-info';
import {SafetyFirst} from '../safety-first';
import {FLAGS, connectToFlags} from '../../features';
import {TectonicChannel} from '../channel-operators/tectonic-channel';
import {ContainerLinuxUpdates} from '../container-linux-update-operator/container-linux-updates';
import {AlertManagersListContainer} from '../alert-manager';

export const SettingsRow = ({children}) => <div className="row co-m-form-row">{children}</div>;
export const SettingsLabel = ({children}) => <div className="col-sm-4 col-md-3"><label>{children}</label></div>;
export const SettingsContent = ({children}) => <div className="col-sm-8 col-md-9">{children}</div>;

export const ClusterSettingsPage = connectToFlags(FLAGS.CLUSTER_UPDATES, FLAGS.PROMETHEUS)(
class ClusterSettingsPage_ extends SafetyFirst {
  componentDidMount() {
    super.componentDidMount();
    coFetchJSON('version').then(version => this.setState({version}));
  }

  render() {
    const { version } = (this.state || {});
    const { CLUSTER_UPDATES, PROMETHEUS } = this.props.flags;

    return <div className="co-p-cluster">
      <Helmet title="Cluster" />
      <div className="co-p-cluster__body">
        <NavTitle title="Cluster Settings" />

          <div>
            {/*TODO: nesting inside an extra <div> to get rid of the bottom border...*/}
            <div className="co-m-pane__body">
              <div className="co-cluster-updates">
                {CLUSTER_UPDATES && <TectonicChannel />}
                <ContainerLinuxUpdates />
              </div>
            </div>
          </div>
        <div className="co-m-pane__body">
          <h1 className="co-p-cluster--heading">General</h1>
          <LicenseSetting />
          <LDAPSetting />
          <CertsInfoContainer />
          {PROMETHEUS && <AlertManagersListContainer />}
        </div>
      </div>
      <DocumentationSidebar version={version} />
    </div>;
  }
});
