import * as React from 'react';
import * as moment from 'moment';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, detailsPage, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary } from './utils';
// eslint-disable-next-line no-unused-vars
import { K8sResourceKindReference } from '../module/k8s';

import { registerTemplate } from '../yaml-templates';

registerTemplate('v1.StorageClass', `apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: example
provisioner: my-provisioner
reclaimPolicy: Delete
`);

export const StorageClassReference: K8sResourceKindReference = 'StorageClass';

const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const StorageClassHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-3" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="provisioner">Provisioner</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="reclaimPolicy">Reclaim Policy</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;


const StorageClassRow: React.StatelessComponent<StorageClassRowProps> = ({obj}) => {
  return <div className="row co-resource-list__item">
    <div className="col-xs-3">
      <ResourceCog actions={menuActions} kind={StorageClassReference} resource={obj} />
      <ResourceLink kind={StorageClassReference} name={obj.metadata.name} namespace={undefined} title={obj.metadata.name} />
    </div>
    <div className="col-xs-3">
      {obj.provisioner}
    </div>
    <div className="col-xs-3">
      {obj.reclaimPolicy}
    </div>
    <div className="col-xs-3">
      { moment(obj.metadata.creationTimestamp).fromNow() }
    </div>
  </div>;
};

const StorageClassDetails: React.StatelessComponent<StorageClassDetailsProps> = ({obj}) => <div className="col-xs-12">
  <Heading text="StorageClass Overview" />
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-sm-6 col-xs-12">
        <ResourceSummary resource={obj} showNodeSelector={false} showPodSelector={false} />
      </div>
    </div>
  </div>
</div>;

export const StorageClassList: React.StatelessComponent = props => <List {...props} Header={StorageClassHeader} Row={StorageClassRow} />;
StorageClassList.displayName = 'StorageClassList';

export const StorageClassPage: React.StatelessComponent<StorageClassPageProps> = props =>
  <ListPage {...props} title="Storage Classes" kind={StorageClassReference} ListComponent={StorageClassList} canCreate={true} filterLabel={props.filterLabel} />;
StorageClassPage.displayName = 'StorageClassListPage';


const pages = [navFactory.details(detailsPage(StorageClassDetails)), navFactory.editYaml()];

export const StorageClassDetailsPage: React.StatelessComponent<StorageClassDetailsPageProps> = props => {
  return <DetailsPage {...props} kind={StorageClassReference} menuActions={menuActions} pages={pages} />;
};
StorageClassDetailsPage.displayName = 'StorageClassDetailsPage';

/* eslint-disable no-undef */
export type StorageClassRowProps = {
  obj: any,
};

export type StorageClassDetailsProps = {
  obj: any,
};

export type StorageClassPageProps = {
  filterLabel: string,
};

export type StorageClassDetailsPageProps = {
  match: any,
};
/* eslint-enable no-undef */

