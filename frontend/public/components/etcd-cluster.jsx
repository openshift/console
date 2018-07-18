import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { EtcdClusterModel } from '../models';
import { referenceForModel } from '../module/k8s';
import { configureClusterSizeModal } from './modals';
import { ColHead, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Cog, ResourceCog, ResourceIcon, Timestamp, Selector, resourcePath, ResourceLink} from './utils';

const {Edit, Delete} = Cog.factory;

const UpdateCount = (kind, cluster) => ({
  label: 'Modify Cluster Size',
  callback: () => configureClusterSizeModal({
    resourceKind: kind,
    resource: cluster
  }),
});

const menuActions = [UpdateCount, Edit, Delete];

const EtcdClusterLink = (props) => {
  const {uid, name, namespace} = props.metadata;
  const path = `/k8s/ns/${namespace}/etcdclusters/${name}`;

  return <span className="co-resource-link">
    <ResourceIcon kind={referenceForModel(EtcdClusterModel)} />
    <Link to={path} title={uid} className="co-resource-link__resource-name">{name}</Link>
  </span>;
};

const EtcdClusterRow = ({obj: cluster}) => {
  const selector = {
    matchLabels: {
      'etcd_cluster': cluster.metadata.name
    }
  };
  const metadata = cluster.metadata;
  const spec = cluster.spec;
  const status = cluster.status || null;
  const backup = _.get(cluster.spec, 'backup', null);

  return <ResourceRow obj={cluster}>
    <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6 co-resource-link-wrapper">
      <ResourceCog actions={menuActions} kind={referenceForModel(EtcdClusterModel)} resource={cluster} />
      <EtcdClusterLink metadata={metadata} />
    </div>
    <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">
      <ResourceLink kind="Namespace" name={cluster.metadata.namespace} title={cluster.metadata.namespace} />
    </div>
    <div className="col-lg-1 col-md-2 col-sm-3 hidden-xs">
      {<Link to={`${resourcePath(referenceForModel(EtcdClusterModel), metadata.name, metadata.namespace)}/pods`} title="pods">
        {status ? `${status.size} of ${spec.size}` : spec.size}
      </Link>}
    </div>
    <div className="col-lg-3 col-md-4 hidden-sm hidden-xs">
      <Selector selector={selector} />
    </div>
    <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
      {backup === null && <div className="text-muted">No backup policy</div>}
      {backup && <div>{_.has(status, 'backupServiceStatus') ? <Timestamp timestamp={status.backupServiceStatus.recentBackup.creationTime} /> : '-'}</div>}
    </div>
  </ResourceRow>;
};

const EtcdClusterHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-3 col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-1 col-md-2 col-sm-3 hidden-xs" sortField="status.size">Size</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-4 hidden-sm hidden-xs" sortFunc="etcdClusterPodSelector">Pod Selector</ColHead>
  <ColHead {...props} className="col-lg-2 hidden-md hidden-sm hidden-xs" sortField="status.backupServiceStatus.recentBackup.creationTime">Last Backup Date</ColHead>
</ListHeader>;

export const EtcdClusterList = props => <List {...props} Header={EtcdClusterHeader} Row={EtcdClusterRow} />;
export const EtcdClustersPage = props => <ListPage {...props} ListComponent={EtcdClusterList} canCreate={true} kind={referenceForModel(EtcdClusterModel)} />;
