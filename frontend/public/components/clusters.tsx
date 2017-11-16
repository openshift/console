import * as React from 'react';
import * as moment from 'moment';
import * as _ from 'lodash';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, detailsPage, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary } from './utils';


const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const ClustersHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-4">URL</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

// eslint-disable-next-line no-unused-vars
type ClustersRowProps = {
  // eslint-disable-next-line no-undef
  obj: any,
};
const ClustersRow: React.StatelessComponent<ClustersRowProps> = ({obj}) => {
  const clusterLink = _.get(obj, ['metadata', 'annotations', 'multicluster.coreos.com/console-url']);

  return <div className="row co-resource-list__item">
    <div className="col-xs-4">
      <ResourceCog actions={menuActions} kind="Cluster" resource={obj} />
      <ResourceLink kind="Cluster" name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
    </div>
    <div className="col-xs-4">
      {clusterLink ? <a href={clusterLink.toString()} target="_blank" rel="noopener noreferrer">{clusterLink} <i className="fa fa-external-link"></i></a> : '—'}
    </div>
    <div className="col-xs-4">
      { moment(obj.metadata.creationTimestamp).fromNow() }
    </div>
  </div>;
};
ClustersRow.displayName = 'ClustersRow';

// eslint-disable-next-line no-unused-vars
type ClustersDetailsProps = {
  // eslint-disable-next-line no-undef
  obj: any,
};
const ClustersDetails: React.StatelessComponent<ClustersDetailsProps> = ({obj}) => <div>
  <Heading text="Cluster Overview" />
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-sm-6 col-xs-12">
        <ResourceSummary resource={obj} podSelector="spec.podSelector" showNodeSelector={false} />
      </div>
    </div>
  </div>
</div>;
ClustersDetails.displayName = 'ClustersDetails';

export const ClustersList: React.StatelessComponent = props => <List {...props} Header={ClustersHeader} Row={ClustersRow} />;
ClustersList.displayName = 'ClustersList';

// eslint-disable-next-line no-unused-vars
type ClustersPageProps = {
  // eslint-disable-next-line no-undef
  filterLabel: string,
};
export const ClustersPage: React.StatelessComponent<ClustersPageProps> = props => <ListPage {...props} kind="Cluster" ListComponent={ClustersList} canCreate={true} filterLabel={props.filterLabel} />;
ClustersPage.displayName = 'ClustersPage';

const pages = [navFactory.details(detailsPage(ClustersDetails)), navFactory.editYaml()];

// eslint-disable-next-line no-unused-vars
type ClustersDetailsPageProps = {
  // eslint-disable-next-line no-undef
  match: any,
};
export const ClustersDetailsPage: React.StatelessComponent<ClustersDetailsPageProps> = props => {
  return <DetailsPage {...props} kind="Cluster" menuActions={menuActions} pages={pages} />;
};
ClustersDetailsPage.displayName = 'ClustersDetailsPage';
