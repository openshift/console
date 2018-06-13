import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, LabelList, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary, Timestamp } from './utils';
import { registerTemplate } from '../yaml-templates';

registerTemplate('v1.PersistentVolume', `apiVersion: v1
kind: PersistentVolume
metadata:
  name: example
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Recycle
  storageClassName: slow
  nfs:
    path: /tmp
    server: 172.17.0.2
`);

const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const Header = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const kind = 'PersistentVolume';
const Row = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-xs-4">
    <ResourceCog actions={menuActions} kind={kind} resource={obj} />
    <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-xs-4">
    <LabelList kind={kind} labels={obj.metadata.labels} />
  </div>
  <div className="col-xs-4">
    <Timestamp timestamp={obj.metadata.creationTimestamp} />
  </div>
</div>;

const Details = ({obj}) => <React.Fragment>
  <div className="co-m-pane__body">
    <Heading text="PersistentVolume Overview" />
    <ResourceSummary resource={obj} podSelector="spec.podSelector" showNodeSelector={false} />
  </div>
</React.Fragment>;

export const PersistentVolumesList = props => <List {...props} Header={Header} Row={Row} />;
export const PersistentVolumesPage = props => <ListPage {...props} ListComponent={PersistentVolumesList} kind={kind} canCreate={true} />;
export const PersistentVolumesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
