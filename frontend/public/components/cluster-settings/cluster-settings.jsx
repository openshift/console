import * as React from 'react';
import { Helmet } from 'react-helmet';

import {NavTitle, DocumentationSidebar} from '../utils';
import {LDAPSetting} from './ldap';
import {CertsInfoContainer} from './certs-info';
import {SafetyFirst} from '../safety-first';
import {FLAGS, connectToFlags} from '../../features';
import {TectonicChannel} from '../channel-operators/tectonic-channel';
import {ContainerLinuxUpdates} from '../container-linux-update-operator/container-linux-updates';

export const SettingsRow = ({children}) => <div className="row co-m-form-row">{children}</div>;
export const SettingsLabel = ({children}) => <div className="col-sm-4 col-md-3"><strong>{children}</strong></div>;
export const SettingsContent = ({children}) => <div className="col-sm-8 col-md-9">{children}</div>;

export const ClusterSettingsPage = connectToFlags(FLAGS.CLUSTER_UPDATES)(
  class ClusterSettingsPage_ extends SafetyFirst {
    render() {
      const { CLUSTER_UPDATES } = this.props.flags;

      return <div className="co-p-cluster co-p-has-sidebar">
        <Helmet>
          <title>Cluster</title>
        </Helmet>
        <div className="co-p-has-sidebar__body">
          <NavTitle title="Cluster Settings" />
          <div className="co-m-pane__body">
            <div className="row" style={{marginBottom: 28}}>
              <div className="col-md-12">
                <div className="co-cluster-updates">
                  <div className="co-cluster-updates__component">
                    <div className="co-cluster-updates__heading--name-wrapper">
                      <span className="co-cluster-updates__heading--name">General</span>
                    </div>
                    <br />
                    <LDAPSetting />
                    <CertsInfoContainer />
                  </div>
                </div>
              </div>
            </div>
            <div className="row" style={{marginBottom: 28}}>
              <div className="col-md-12">
                <div className="co-cluster-updates">
                  {CLUSTER_UPDATES && <TectonicChannel />}
                  <ContainerLinuxUpdates />
                </div>
              </div>
            </div>
          </div>
        </div>
        <DocumentationSidebar />
      </div>;
    }
  });
