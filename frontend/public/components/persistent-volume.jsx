import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, LabelList, navFactory, ResourceCog, SectionHeading, ResourceLink, ResourceSummary, Timestamp } from './utils';

const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const Header = props => <ListHeader>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-sm-4 hidden-xs" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const kind = 'PersistentVolume';
const Row = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-sm-4 col-xs-6 co-resource-link-wrapper">
    <ResourceCog actions={menuActions} kind={kind} resource={obj} />
    <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-sm-4 col-xs-6">
    <LabelList kind={kind} labels={obj.metadata.labels} />
  </div>
  <div className="col-sm-4 hidden-xs">
    <Timestamp timestamp={obj.metadata.creationTimestamp} />
  </div>
</div>;

const Details = ({obj}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="PersistentVolume Overview" />
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
