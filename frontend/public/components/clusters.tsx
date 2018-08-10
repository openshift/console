import * as React from 'react';
import * as _ from 'lodash-es';

import { FLAGS, connectToFlags, flagPending } from '../features';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Cog, detailsPage, navFactory, ResourceCog, SectionHeading, ResourceLink, ResourceSummary, LoadingBox, MsgBox } from './utils';
// eslint-disable-next-line no-unused-vars
import { referenceForModel } from '../module/k8s';
import { ClusterModel } from '../models';

const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const ClustersHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Cluster Name</ColHead>
  <ColHead {...props} className="col-xs-3">Type</ColHead>
  <ColHead {...props} className="col-xs-5">Addresses</ColHead>
</ListHeader>;

const ClustersRow: React.SFC<ClustersRowProps> = ({obj}) => {
  const clusterLink = _.get(obj, ['metadata', 'annotations', 'multicluster.coreos.com/console-url']);
  const clusterType = _.get(obj, ['metadata', 'annotations', 'multicluster.coreos.com/directory']);

  return <div className="row co-resource-list__item">
    <div className="col-xs-4 co-resource-link-wrapper">
      <ResourceCog actions={menuActions} kind={referenceForModel(ClusterModel)} resource={obj} />
      <ResourceLink kind={referenceForModel(ClusterModel)} name={obj.metadata.name} namespace={undefined} title={obj.metadata.name} />
    </div>
    <div className="col-xs-3">
      { clusterType ? 'Directory': 'Replica' } Cluster
    </div>
    <div className="col-xs-5">
      {clusterLink
        ? <span className="text-muted">Console:&nbsp;
          <a href={clusterLink.toString()} target="_blank" className="co-external-link" rel="noopener noreferrer">{clusterLink}</a>
        </span>
        : '—'
      }
    </div>
  </div>;
};

const ClustersDetails: React.SFC<ClustersDetailsProps> = ({obj}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="Cluster Overview" />
    <ResourceSummary resource={obj} showNodeSelector={false} showPodSelector={false} />
  </div>
</React.Fragment>;

const EmptyMsg = () => <MsgBox title="No Clusters in Directory" detail="Adding clusters to the directory allows administrators to change configuration across many clusters at once" />;
export const ClustersList: React.SFC = props => <List {...props} Header={ClustersHeader} Row={ClustersRow} EmptyMsg={EmptyMsg} />;

const FeatureFlagGate = connectToFlags(FLAGS.MULTI_CLUSTER)(props => {
  if (flagPending(props.flags[FLAGS.MULTI_CLUSTER])) {
    return <LoadingBox />;
  }
  if (props.flags[FLAGS.MULTI_CLUSTER]) {
    return <ListPage {...props} title="Cluster Directory" kind={referenceForModel(ClusterModel)} ListComponent={ClustersList} canCreate={true} />;
  }
  return <div>
    <div className="co-well">
      <h4>Getting Started</h4>
      <p>
      Multi-Cluster Directory is not yet installed and enabled.
      See our documention for instructions on how to install Multi-Cluster Directory on your Tectonic Cluster.
      </p>
      <p>
        Multi-Cluster is an alpha feature.
      </p>
      <a href="https://coreos.com/tectonic/docs/latest/admin/multi-cluster.html" target="_blank" rel="noopener noreferrer">
        <button className="btn btn-info">Installing Multi-cluster Directory <i className="fa fa-external-link" /></button>
      </a>
    </div>
    <ListPage {...props} title="Cluster Directory" kind={referenceForModel(ClusterModel)} ListComponent={ClustersList} canCreate={true} fake={true} />
    <div style={{marginTop: '-60px', textAlign: 'center'}}>
      <EmptyMsg />
    </div>
  </div>;
});

export const ClustersPage: React.SFC<ClustersPageProps> = props => <div><FeatureFlagGate {...props} /></div>;

const pages = [navFactory.details(detailsPage(ClustersDetails)), navFactory.editYaml()];

export const ClustersDetailsPage: React.SFC<ClustersDetailsPageProps> = props => {
  return <DetailsPage {...props} kind={referenceForModel(ClusterModel)} menuActions={menuActions} pages={pages} />;
};

/* eslint-disable no-undef */
export type ClustersRowProps = {
  obj: any,
};

export type ClustersDetailsProps = {
  obj: any,
};

export type ClustersPageProps = {
  filterLabel: string,
};

export type ClustersDetailsPageProps = {
  match: any,
};
/* eslint-enable no-undef */

ClustersRow.displayName = 'ClustersRow';
ClustersDetails.displayName = 'ClustersDetails';
ClustersList.displayName = 'ClustersList';
ClustersPage.displayName = 'ClustersPage';
ClustersDetailsPage.displayName = 'ClustersDetailsPage';
