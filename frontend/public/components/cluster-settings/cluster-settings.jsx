import React from 'react';

import {NavTitle} from '../utils';
import {register} from '../react-wrapper';
import {ClusterUpdates} from '../cluster-updates/cluster-updates';

export const ClusterSettingsPage = () => <div className="co-p-cluster">
  <div className="co-p-cluster__body">
    <NavTitle title="Cluster Settings" />
    <div>
      {/*TODO: nesting inside an extra <div> to get rid of the bottom border...*/}
      <div className="co-m-pane__body">
        <ClusterUpdates />
      </div>
    </div>
    <div className="co-m-pane__body">
      <h1 className="co-p-cluster--heading">General</h1>
      <p>General settings for your cluster</p>
    </div>
    <div className="co-m-pane__body">
      <h1 className="co-p-cluster--heading">Tectonic Console</h1>
      <p>Console is how you and your users interact with your Tectonic cluster and view the status and health of your applications.</p>
    </div>
    <div className="co-m-pane__body">
      <h1 className="co-p-cluster--heading">Tectonic Identity</h1>
      <p>Identity is the Tectonic component that manages user accounts, resetting password, etc. Delegation to other authentication systems, such as Google OAUTH or a corporate LDAP environment is supported.</p>
    </div>
  </div>
  <div className="co-p-cluster__sidebar">
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
  </div>
</div>;

register('ClusterSettingsPage', ClusterSettingsPage);
