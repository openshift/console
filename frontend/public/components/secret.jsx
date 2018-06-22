import * as _ from 'lodash-es';
import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { SecretData } from './configmap-and-secret-data';
import { Cog, ResourceCog, ResourceLink, ResourceSummary, detailsPage, navFactory, resourceObjPath } from './utils';
import { fromNow } from './utils/datetime';
import { registerTemplate } from '../yaml-templates';

registerTemplate('v1.Secret', `apiVersion: v1
kind: Secret
metadata:
  name: example
type: Opaque
stringData:
  username: admin
  password: opensesame`);

export const WebHookSecretKey = 'WebHookSecretKey';

// Edit in YAML if not editing a webhook secret with one key.
const editInYaml = obj => !_.has(obj, ['data', WebHookSecretKey]) || _.size(obj.data) !== 1;

const menuActions = [
  Cog.factory.ModifyLabels,
  Cog.factory.ModifyAnnotations,
  (kind, obj) => ({
    label: `Edit ${kind.label}...`,
    href: editInYaml(obj) ? `${resourceObjPath(obj, kind.kind)}/edit-yaml` : `${resourceObjPath(obj, kind.kind)}/edit`,
  }),
  Cog.factory.Delete,
];

const SecretHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 hidden-xs" sortField="type">Type</ColHead>
  <ColHead {...props} className="col-md-1 hidden-sm hidden-xs" sortFunc="dataSize">Size</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const SecretRow = ({obj: secret}) => {
  const data = _.size(secret.data);
  const age = fromNow(secret.metadata.creationTimestamp);

  return <ResourceRow obj={secret}>
    <div className="col-md-3 col-sm-4 col-xs-6">
      <ResourceCog actions={menuActions} kind="Secret" resource={secret} />
      <ResourceLink kind="Secret" name={secret.metadata.name} namespace={secret.metadata.namespace} title={secret.metadata.uid} />
    </div>
    <div className="col-md-3 col-sm-4 col-xs-6">
      <ResourceLink kind="Namespace" name={secret.metadata.namespace} title={secret.metadata.namespace} />
    </div>
    <div className="col-md-3 col-sm-4 hidden-xs">{secret.type}</div>
    <div className="col-md-1 hidden-sm hidden-xs">{data}</div>
    <div className="col-md-2 hidden-sm hidden-xs">{age}</div>
  </ResourceRow>;
};

const SecretDetails = ({obj: secret}) => {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <ResourceSummary resource={secret} showPodSelector={false} showNodeSelector={false} />
    </div>
    <div className="co-m-pane__body">
      <SecretData data={secret.data} type={secret.type} />
    </div>
  </React.Fragment>;
};

const SecretsList = props => <List {...props} Header={SecretHeader} Row={SecretRow} />;
SecretsList.displayName = 'SecretsList';

const secretType = secret => secret.type;

const filters = [{
  type: 'secret-type',
  selected: ['kubernetes.io/service-account-token', 'kubernetes.io/dockercfg', 'kubernetes.io/dockerconfigjson', 'kubernetes.io/basic-auth', 'kubernetes.io/ssh-auth', 'kubernetes.io/tls', 'Opaque'],
  reducer: secretType,
  items: [
    {id: 'kubernetes.io/basic-auth', title: 'basic-auth'},
    {id: 'kubernetes.io/dockercfg', title: 'dockercfg'},
    {id: 'kubernetes.io/dockerconfigjson', title: 'dockerconfigjson'},
    {id: 'kubernetes.io/service-account-token', title: 'service-account-token'},
    {id: 'kubernetes.io/ssh-auth', title: 'ssh-auth'},
    {id: 'kubernetes.io/tls', title: 'tls'},
    {id: 'Opaque', title: 'Opaque'}
  ],
}];

const SecretsPage = props => {
  const createItems = {
    // source: 'Create Source Secret',
    // image: 'Create Image Pull Secret',
    // generic: 'Create Key/Value Secret',
    webhook: 'Webhook Secret',
    yaml: 'Secret from YAML',
  };

  const createProps = {
    items: createItems,
    createLink: (type) => `/k8s/ns/${props.namespace}/secrets/new/${type !== 'yaml' ? type : ''}`
  };

  return <ListPage ListComponent={SecretsList} canCreate={true} rowFilters={filters} createButtonText="Create" createProps={createProps} {...props} />;
};

const SecretsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(detailsPage(SecretDetails)), navFactory.editYaml()]}
/>;

export {SecretsList, SecretsPage, SecretsDetailsPage};
