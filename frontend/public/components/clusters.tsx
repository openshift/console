import * as React from 'react';
import * as _ from 'lodash';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, detailsPage, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary } from './utils';


const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const ClustersHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Cluster Name</ColHead>
  <ColHead {...props} className="col-xs-3">Type</ColHead>
  <ColHead {...props} className="col-xs-5">Addresses</ColHead>
</ListHeader>;

// eslint-disable-next-line no-unused-vars
type ClustersRowProps = {
  // eslint-disable-next-line no-undef
  obj: any,
};
const ClustersRow: React.StatelessComponent<ClustersRowProps> = ({obj}) => {
  const clusterLink = _.get(obj, ['metadata', 'annotations', 'multicluster.coreos.com/console-url']);
  const clusterType = _.get(obj, ['metadata', 'annotations', 'multicluster.coreos.com/directory']);

  return <div className="row co-resource-list__item">
    <div className="col-xs-4">
      <ResourceCog actions={menuActions} kind="Cluster" resource={obj} />
      <ResourceLink kind="Cluster" name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
    </div>
    <div className="col-xs-3">
      { clusterType ? 'Directory': 'Replica' } Cluster
    </div>
    <div className="col-xs-5">
      {clusterLink
        ? <span className="text-muted">Console:&nbsp;
          <a href={clusterLink.toString()} target="_blank" rel="noopener noreferrer">{clusterLink} <i className="fa fa-external-link"></i></a>
        </span>
        : '—'
      }
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
export const ClustersPage: React.StatelessComponent<ClustersPageProps> = props => <div>
  <div className="co-well" style={{marginBottom: 0}}>
    Thanks for trying out the Multi-Cluster Directory. Future updates will enable add/remove and other policy features. Feedback and questions are encouraged: <a href="mailto:tectonic-alpha-feedback@coreos.com">tectonic-alpha-feedback@coreos.com</a>
  </div>
  <ListPage {...props} title="Cluster Directory" kind="Cluster" ListComponent={ClustersList} canCreate={false} filterLabel={props.filterLabel} />
</div>;
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
