import * as _ from 'lodash-es';
import * as React from 'react';
import { safeDump } from 'js-yaml';
import { Base64 } from 'js-base64';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Kebab, SectionHeading, navFactory, ResourceKebab, ResourceLink, ResourceSummary } from './utils';
import { fromNow } from './utils/datetime';
import { k8sList } from '../module/k8s';
import { SecretModel } from '../models';
import { SecretsPage } from './secret';
import { saveAs } from 'file-saver';
import { errorModal } from './modals';

const KubeConfigify = (kind, sa) => ({
  label: 'Download kubeconfig file',
  weight: 200,
  callback: () => {
    const name = sa.metadata.name;
    const namespace = sa.metadata.namespace;

    k8sList(SecretModel, {ns: namespace}).then((secrets) => {
      const server = window.SERVER_FLAGS.kubeAPIServerURL;
      const url = new URL(server);
      const clusterName = url.host.replace(/\./g, '-');

      // Find the secret that is the service account token.
      const saSecretsByName = _.keyBy(sa.secrets, 'name');
      const secret = _.find(secrets, s => saSecretsByName[s.metadata.name] && s.type === 'kubernetes.io/service-account-token');
      if (!secret) {
        errorModal({error: 'Unable to get service account token.'});
        return;
      }
      const token = Base64.decode(secret.data.token);
      const cert = secret.data['ca.crt'];

      const config = {
        apiVersion: 'v1',
        clusters: [{
          cluster: {
            'certificate-authority-data': cert,
            server,
          },
          name: clusterName,
        }],
        contexts: [{
          context: {
            cluster: clusterName,
            namespace,
            user: name,
          },
          name,
        }],
        'current-context': name,
        kind: 'Config',
        preferences: {},
        'users': [{
          name,
          user: {
            token,
          },
        }],
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
const { common } = Kebab.factory;
const menuActions = [KubeConfigify, ...common];

const Header = props => <ListHeader>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs" sortField="secrets">Secrets</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs" sortField="metadata.creationTimestamp">Age</ColHead>
</ListHeader>;

const ServiceAccountRow = ({obj: serviceaccount}) => {
  const {metadata: {name, namespace, uid, creationTimestamp}, secrets} = serviceaccount;

  return (
    <ResourceRow obj={serviceaccount}>
      <div className="col-sm-4 col-xs-6">
        <ResourceLink kind="ServiceAccount" name={name} namespace={namespace} title={uid} />
      </div>
      <div className="col-sm-4 col-xs-6 co-break-word">
        <ResourceLink kind="Namespace" name={namespace} title={namespace} /> {}
      </div>
      <div className="col-sm-2 hidden-xs">
        {secrets ? secrets.length : 0}
      </div>
      <div className="col-sm-2 hidden-xs">
        {fromNow(creationTimestamp)}
      </div>
      <div className="dropdown-kebab-pf">
        <ResourceKebab actions={menuActions} kind="ServiceAccount" resource={serviceaccount} />
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
        <SectionHeading text="Service Account Overview" />
        <ResourceSummary resource={serviceaccount} showNodeSelector={false} />
      </div>
      <div className="co-m-pane__body co-m-pane__body--alt">
        <SectionHeading text="Secrets" style={{marginBottom: '-20px'}} />
      </div>
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
const ServiceAccountsPage = props => <ListPage ListComponent={ServiceAccountsList} {...props} canCreate={true} />;
export {ServiceAccountsList, ServiceAccountsPage, ServiceAccountsDetailsPage};
