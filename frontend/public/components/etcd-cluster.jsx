import React from 'react';
import { Link } from 'react-router';
import { Tooltip } from 'react-lightweight-tooltip';

import { k8sKinds } from '../module/k8s';
import { SafetyFirst } from './safety-first';
import { configureClusterSizeModal } from './modals';
import { ListPage, List, DetailsPage } from './factory';
import { PodsPage } from './pod';
import { Cog, navFactory, ResourceCog, ResourceIcon, Timestamp, Selector, resourcePath, pluralize, LoadingInline} from './utils';

const {Edit, Delete} = Cog.factory;

const UpdateCount = (kind, cluster) => ({
  label: 'Modify Cluster Size',
  weight: 120,
  callback: () => configureClusterSizeModal({
    resourceKind: kind,
    resource: cluster
  }),
});

const menuActions = [UpdateCount, Edit, Delete];

const EtcdClusterLink = (props) => {
  const {uid, name, namespace} = props.metadata;
  const path = `ns/${namespace}/clusters/${name}/details`;

  return <span className="co-resource-link">
    <ResourceIcon kind="cluster" />
    <Link to={path} title={uid}>{name}</Link>
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

  return <div className="row co-resource-list__item">
    <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
      <ResourceCog actions={menuActions} kind="cluster" resource={cluster} />
      <EtcdClusterLink metadata={metadata} />
    </div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      {<Link to={`${resourcePath('cluster', metadata.name, metadata.namespace)}/pods`} title="pods">
        {status ? `${status.size} of ${spec.size}` : spec.size}
      </Link>}
    </div>
    <div className="col-lg-4 col-md-4 hidden-sm hidden-xs">
      <Selector selector={selector} />
    </div>
    <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
      {backup === null && <div className="text-muted">No backup policy</div>}
      {backup && <div>{_.has(status, 'backupServiceStatus') ? <Timestamp timestamp={status.backupServiceStatus.recentBackup.creationTime}  /> : '-'}</div>}
    </div>
  </div>;
};

const EtcdClusterHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Name</div>
  <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">Size</div>
  <div className="col-lg-4 col-md-4 col-sm-2 hidden-xs">Pod Selector</div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">Last Backup Date</div>
</div>;

export class EtcdClusterDetails extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      sizeCountOutdated: false
    };
    this._openSizeCountModal = this._openSizeCountModal.bind(this);
  }

  componentWillReceiveProps() {
    this.setState({
      sizeCountOutdated: false
    });
  }

  _openSizeCountModal(event) {
    event.preventDefault();
    event.target.blur();
    configureClusterSizeModal({
      resourceKind: k8sKinds.CLUSTER,
      resource: this.props,
      invalidateState: (isInvalid) => {
        this.setState({
          sizeCountOutdated: isInvalid
        });
      }
    });
  }

  render() {
    const cluster = this.props;

    const metadata = cluster.metadata;
    const spec = cluster.spec;
    const status = cluster.status || null;
    const members = _.get(cluster.status, 'members', null);
    const specBackup = _.get(cluster.spec, 'backup', null);
    const statusBackup = _.get(cluster.status, 'backupServiceStatus', null);

    return <div>
      <div className="co-m-pane__body">
        <div className="co-m-pane__body-group">
          <div className="row no-gutter">
            <div className="co-detail-table">
              <div className="co-detail-table__row row">
                <div className="co-detail-table__section col-sm-3">
                  <dl>
                    <dt className="co-detail-table__section-header">Desired Size</dt>
                    <dd>{this.state.sizeCountOutdated ? <LoadingInline /> : <a className="co-m-modal-link" href="#" onClick={this._openSizeCountModal}>{pluralize(spec.size, 'pod')}</a>}</dd>
                  </dl>
                </div>
                <div className="co-detail-table__section col-sm-3">
                  <dl>
                    <dt className="co-detail-table__section-header">Current Size</dt>
                    <dd>
                      {status ? pluralize(status.size, 'pod') : '-'}
                    </dd>
                  </dl>
                </div>
                {members && <div className="co-detail-table__section co-detail-table__section--last col-sm-6">
                  <dl>
                    <dt className="co-detail-table__section-header">Members</dt>
                    <dd>
                      <Tooltip content="Total number of etcd members that are ready to serve requests">
                        {_.has(members, 'ready') && pluralize(members.ready.length, 'pod')}
                      </Tooltip>
                    </dd>
                  </dl>
                  <div className="co-detail-table__bracket"></div>
                  <div className="co-detail-table__breakdown">
                    <Tooltip content="Total number of etcd members that are not ready to serve requests">
                      {_.has(members, 'unready') && pluralize(_.get(members.unready.length, '-'), 'pod')}
                    </Tooltip>
                    {_.has(members, 'unready') && <Tooltip content="Total number of unavailable pods targeted by this etcdCluster">{members.unready.length || 0} unready</Tooltip>}
                  </div>
                </div>}
              </div>
            </div>
          </div>
        </div>

        <div className="co-m-pane__body-group">
          <div className="row no-gutter">
            <div className="col-sm-6">
              <dt>Phase</dt>
              <dd>{status ? status.phase : '-'}</dd>
              <dt>Name</dt>
              <dd>{metadata.name}</dd>
            </div>
            <div className="col-sm-6">
              <dt>Desired Version</dt>
              <dd>{spec.version}</dd>
              <dt>Current Version</dt>
              <dd>{status ? status.currentVersion : '-'}</dd>
            </div>
          </div>
        </div>
      </div>

      {specBackup && <div className="co-m-pane__body">
        <div className="co-m-pane__body-section--bordered">
          <h1 className="co-section-title">Cluster Backup</h1>
          <div className="row no-gutter">
            <div className="col-sm-6">
              <dt>Backup Interval</dt>
              <dd>{specBackup.backupIntervalInSecond}</dd>
              <dt>Maximum Backups</dt>
              <dd>{specBackup.maxBackups}</dd>
              {statusBackup && <dt>Number of Backups</dt>}
              {statusBackup && <dd>{statusBackup.backupSize}</dd>}
            </div>
            <div className="col-sm-6">
              <dt>Storage Type</dt>
              <dd>{specBackup.storageType}</dd>
              {specBackup.storageType === 'PersistentVolume' && <dt>Volume Size</dt>}
              {specBackup.storageType === 'PersistentVolume' && <dd>{specBackup.pv.volumeSizeInMB} MB</dd>}
              {statusBackup && <dt>Current Backup Size</dt>}
              {statusBackup && <dd>{statusBackup.backups}</dd>}
            </div>
          </div>
        </div>
      </div>}

      {specBackup && statusBackup && _.has(statusBackup, 'recentBackup') && <div className="co-m-pane__body">
        <div className="co-m-pane__body-section--bordered">
          <h1 className="co-section-title">Recent Backup</h1>
          <div className="row no-gutter">
            <div className="co-m-table-grid co-m-table-grid--bordered">
              <div className="row co-m-table-grid__head">
                <div className="col-sm-4 col-xs-4">Backup Date</div>
                <div className="col-sm-2">Size</div>
                <div className="col-sm-2">Version</div>
                <div className="col-sm-2">Time it took</div>
              </div>
              <div className="co-m-table-grid__body">
                <div className="col-sm-4 col-xs-4">{statusBackup.recentBackup.creationTime}</div>
                <div className="col-sm-2">{statusBackup.recentBackup.creationTime}</div>
                <div className="col-sm-2">{statusBackup.recentBackup.version}</div>
                <div className="col-sm-2">{statusBackup.recentBackup.timeTookInSecond}s</div>
              </div>
            </div>
          </div>
        </div>
      </div>}
    </div>;
  }
}

const {details, editYaml, pods} = navFactory;
const pages = [details(EtcdClusterDetails), editYaml(),
  pods(({metadata: {name}}) => <PodsPage showTitle={false} selector={{matchLabels: {'etcd_cluster': name}}} />)];
export const EtcdClustersDetailsPage = props => <DetailsPage pages={pages} menuActions={menuActions} {...props} />;

export const EtcdClusterList = props => <List {...props} Header={EtcdClusterHeader} Row={EtcdClusterRow} />;
export const EtcdClustersPage = props => <ListPage ListComponent={EtcdClusterList} canCreate={true} {...props} />;
