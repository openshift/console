import * as _ from 'lodash-es';
import * as React from 'react';
import { safeDump } from 'js-yaml';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Cog, navFactory, NavTitle, ResourceCog, ResourceLink, ResourceSummary } from './utils';
import { fromNow } from './utils/datetime';
import { k8sGet } from '../module/k8s';
import { SecretModel } from '../models';
import { SecretsPage } from './secret';
import { registerTemplate } from '../yaml-templates';
import { saveAs } from 'file-saver';
import { errorModal } from './modals';

const KubeConfigify = (kind, sa) => ({
  label: 'Download kubeconfig file',
  weight: 200,
  callback: () => {
    const name = _.get(sa, 'secrets[0].name');
    const namespace = sa.metadata.namespace;

    k8sGet(SecretModel, name, namespace).then(({data}) => {
      const server = window.SERVER_FLAGS.kubeAPIServerURL;
      const clusterName = window.SERVER_FLAGS.clusterName;

      const token = atob(data.token);
      const cert = data['ca.crt'];

      const config = {
        apiVersion: 'v1',
        'current-context': name,
        kind: 'Config',
        preferences: {},
        clusters: [{
          name: clusterName,
          cluster: {
            'certificate-authority-data': cert,
            server,
          }
        }],
        contexts: [{
          name,
          context: {
            cluster: clusterName,
            namespace,
            user: name,
          }
        }],
        'users': [{
          name,
          user: {
            token: token,
          }
        }]
      };
      const dump = safeDump(config);
      const blob = new Blob([dump], { type: 'text/yaml;charset=utf-8' });
      saveAs(blob, `kube-config-sa-${name}-${clusterName}`);
    }).catch(err => {
      const error = err.message;
      errorModal({error});
    });
  },
});
const menuActions = [KubeConfigify, Cog.factory.Delete];

registerTemplate('v1.ServiceAccount', `apiVersion: v1
kind: ServiceAccount
metadata:
  name: example`);

const Header = props => <ListHeader>
  <ColHead {...props} className="col-xs-3" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="secrets">Secrets</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.creationTimestamp">Age</ColHead>
</ListHeader>;

const ServiceAccountRow = ({obj: serviceaccount, style}) => {
  const {metadata: {name, namespace, uid, creationTimestamp}, secrets} = serviceaccount;

  return (
    <ResourceRow obj={serviceaccount} style={style}>
      <div className="col-xs-3">
        <ResourceCog actions={menuActions} kind="ServiceAccount" resource={serviceaccount} />
        <ResourceLink kind="ServiceAccount" name={name} namespace={namespace} title={uid} />
      </div>
      <div className="col-xs-3">
        <ResourceLink kind="Namespace" name={namespace} title={namespace}/> {}
      </div>
      <div className="col-xs-3">
        {secrets ? secrets.length : 0}
      </div>
      <div className="col-xs-3">
        {fromNow(creationTimestamp)}
      </div>
    </ResourceRow>
  );
};

const Details = ({obj: serviceaccount}) => {
  const {metadata: {namespace}, secrets} = serviceaccount;
  const filters = {selector: {field: 'metadata.name', values: new Set(_.map(secrets, 'name'))}};

  return (
    <React.Fragment>
      <div className="co-m-pane__body">
        <ResourceSummary resource={serviceaccount} showPodSelector={false} showNodeSelector={false} />
      </div>
      <NavTitle title="Secrets" />
      <SecretsPage kind="Secret" canCreate={false} namespace={namespace} filters={filters} autoFocus={false} showTitle={false} />
    </React.Fragment>
  );
};

const ServiceAccountsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
const ServiceAccountsList = props => <List {...props} Header={Header} Row={ServiceAccountRow} />;
const ServiceAccountsPage = props => <ListPage ListComponent={ServiceAccountsList} {...props} canCreate={true}/>;
export {ServiceAccountsList, ServiceAccountsPage, ServiceAccountsDetailsPage};
