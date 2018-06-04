import * as _ from 'lodash-es';
import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { SecretData } from './configmap-and-secret-data';
import { Cog, ResourceCog, ResourceLink, ResourceSummary, detailsPage, navFactory } from './utils';
import { fromNow } from './utils/datetime';
import { registerTemplate } from '../yaml-templates';

registerTemplate('v1.Secret', `apiVersion: v1
kind: Secret
metadata:
  name: example
type: Opaque
data:
  username: YWRtaW4=
  password: MWYyZDFlMmU2N2Rm`);

const menuActions = Cog.factory.common;

const SecretHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 hidden-xs" sortField="type">Type</ColHead>
  <ColHead {...props} className="col-md-1 hidden-sm hidden-xs" sortFunc="dataSize">Size</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const SecretRow = ({obj: secret, style}) => {
  const data = _.size(secret.data);
  const age = fromNow(secret.metadata.creationTimestamp);

  return <ResourceRow obj={secret} style={style}>
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

const SecretsPage = props => <ListPage ListComponent={SecretsList} canCreate={true} {...props} />;
const SecretsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(detailsPage(SecretDetails)), navFactory.editYaml()]}
/>;

export {SecretsList, SecretsPage, SecretsDetailsPage};
