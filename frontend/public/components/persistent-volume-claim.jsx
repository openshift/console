import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary } from './utils';
import { registerTemplate } from '../yaml-templates';

registerTemplate('v1.PersistentVolumeClaim', `kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: example
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 8Gi
  storageClassName: slow
  selector:
    matchLabels:
      release: "stable"
    matchExpressions:
      - {key: environment, operator: In, values: [dev]}
`);

const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const Header = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.namespace">Namespace</ColHead>
</ListHeader>;

const kind = 'PersistentVolumeClaim';
const Row = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-xs-4">
    <ResourceCog actions={menuActions} kind={kind} resource={obj} />
    <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-xs-3">
    <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
  </div>
</div>;

const Details = ({obj}) => <React.Fragment>
  <div className="co-m-pane__body">
    <Heading text="PersistentVolumeClaim Overview" />
    <ResourceSummary resource={obj} podSelector="spec.podSelector" showNodeSelector={false} />
  </div>
</React.Fragment>;

export const PersistentVolumeClaimsList = props => <List {...props} Header={Header} Row={Row} />;
export const PersistentVolumeClaimsPage = props => <ListPage {...props} ListComponent={PersistentVolumeClaimsList} kind={kind} canCreate={true} />;
export const PersistentVolumeClaimsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
