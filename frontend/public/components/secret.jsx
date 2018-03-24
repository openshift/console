import * as _ from 'lodash-es';
import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import ConfigMapAndSecretData from './configmap-and-secret-data';
import { Cog, Heading, ResourceCog, ResourceLink, ResourceSummary, detailsPage, navFactory } from './utils';
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
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs" sortFunc="dataSize">Size</ColHead>
  <ColHead {...props} className="col-sm-2 hidden-xs" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const SecretRow = ({obj: secret}) => {
  const data = _.size(secret.data);
  const age = fromNow(secret.metadata.creationTimestamp);

  return <ResourceRow obj={secret}>
    <div className="col-sm-4 col-xs-6">
      <ResourceCog actions={menuActions} kind="Secret" resource={secret} />
      <ResourceLink kind="Secret" name={secret.metadata.name} namespace={secret.metadata.namespace} title={secret.metadata.uid} />
    </div>
    <div className="col-sm-4 col-xs-6">
      <ResourceLink kind="Namespace" name={secret.metadata.namespace} title={secret.metadata.namespace} />
    </div>
    <div className="col-sm-2 hidden-xs">{data}</div>
    <div className="col-sm-2 hidden-xs">{age}</div>
  </ResourceRow>;
};

const SecretDetails = ({obj: secret}) => {
  return <div className="col-md-12">
    <div className="co-m-pane">
      <div className="co-m-pane__body">
        <ResourceSummary resource={secret} showPodSelector={false} showNodeSelector={false} />
      </div>

      <Heading text="Data" />
      <div className="co-m-pane__body">
        <ConfigMapAndSecretData data={secret.data} decode={window.atob} />
      </div>
    </div>
  </div>;
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
