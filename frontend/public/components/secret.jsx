import * as _ from 'lodash-es';
import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { SecretData } from './configmap-and-secret-data';
import { Cog, SectionHeading, ResourceCog, ResourceLink, ResourceSummary, detailsPage, navFactory, resourceObjPath } from './utils';
import { fromNow } from './utils/datetime';
import { SecretType } from './secrets/create-secret';

export const WebHookSecretKey = 'WebHookSecretKey';

// Edit in YAML if not editing:
// - source secrets
// - webhook secret with one key.
const editInYaml = obj => {
  switch (obj.type) {
    case SecretType.basicAuth:
    case SecretType.sshAuth:
      return false;
    case SecretType.opaque:
      return !_.has(obj, ['data', WebHookSecretKey]) || _.size(obj.data) !== 1;
    default:
      return true;
  }
};

const menuActions = [
  Cog.factory.ModifyLabels,
  Cog.factory.ModifyAnnotations,
  (kind, obj) => ({
    label: `Edit ${kind.label}`,
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
    <div className="col-md-3 col-sm-4 col-xs-6 co-resource-link-wrapper">
      <ResourceCog actions={menuActions} kind="Secret" resource={secret} />
      <ResourceLink kind="Secret" name={secret.metadata.name} namespace={secret.metadata.namespace} title={secret.metadata.uid} />
    </div>
    <div className="col-md-3 col-sm-4 col-xs-6 co-break-word">
      <ResourceLink kind="Namespace" name={secret.metadata.namespace} title={secret.metadata.namespace} />
    </div>
    <div className="col-md-3 col-sm-4 hidden-xs co-break-word">{secret.type}</div>
    <div className="col-md-1 hidden-sm hidden-xs">{data}</div>
    <div className="col-md-2 hidden-sm hidden-xs">{age}</div>
  </ResourceRow>;
};

const SecretDetails = ({obj: secret}) => {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Secret Overview" />
      <ResourceSummary resource={secret} showPodSelector={false} showNodeSelector={false} />
    </div>
    <div className="co-m-pane__body">
      <SecretData data={secret.data} type={secret.type} />
    </div>
  </React.Fragment>;
};

const SecretsList = props => <List {...props} Header={SecretHeader} Row={SecretRow} />;
SecretsList.displayName = 'SecretsList';

const IMAGE_FILTER_VALUE = 'Image';
const SOURCE_FILTER_VALUE = 'Source';
const TLS_FILTER_VALUE = 'TLS';
const SA_TOKEN_FILTER_VALUE = 'Service Account Token';
const OPAQUE_FILTER_VALUE = 'Opaque';

const secretTypeFilterValues = [
  IMAGE_FILTER_VALUE,
  SOURCE_FILTER_VALUE,
  TLS_FILTER_VALUE,
  SA_TOKEN_FILTER_VALUE,
  OPAQUE_FILTER_VALUE
];

export const secretTypeFilterReducer = secret => {
  switch (secret.type) {
    case SecretType.dockercfg:
    case SecretType.dockerconfigjson:
      return IMAGE_FILTER_VALUE;

    case SecretType.basicAuth:
    case SecretType.sshAuth:
      return SOURCE_FILTER_VALUE;

    case SecretType.tls:
      return TLS_FILTER_VALUE;

    case SecretType.serviceAccountToken:
      return SA_TOKEN_FILTER_VALUE;

    default:
      // This puts all unrecognized types under "Opaque". Since unrecognized types should be uncommon,
      // it avoids an "Other" category that is usually empty.
      return OPAQUE_FILTER_VALUE;
  }
};

const filters = [{
  type: 'secret-type',
  selected: secretTypeFilterValues,
  reducer: secretTypeFilterReducer,
  items: secretTypeFilterValues.map(filterValue => ({ id: filterValue, title: filterValue })),
}];

const SecretsPage = props => {
  const createItems = {
    // image: 'Create Image Pull Secret',
    // generic: 'Create Key/Value Secret',
    source: 'Source Secret',
    webhook: 'Webhook Secret',
    yaml: 'Secret from YAML',
  };

  const createProps = {
    items: createItems,
    createLink: (type) => `/k8s/ns/${props.namespace || 'default'}/secrets/new/${type !== 'yaml' ? type : ''}`
  };

  return <ListPage ListComponent={SecretsList} canCreate={true} rowFilters={filters} createButtonText="Create" createProps={createProps} {...props} />;
};

const SecretsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(detailsPage(SecretDetails)), navFactory.editYaml()]}
/>;

export {SecretsList, SecretsPage, SecretsDetailsPage};
