import * as React from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-lightweight-tooltip';

import { k8sKinds } from '../module/k8s';
import { SafetyFirst } from './safety-first';
import { configureClusterSizeModal } from './modals';
import { ColHead, List, ListHeader, ListPage, DetailsPage, ResourceRow } from './factory';
import { PodsPage } from './pod';
import { Cog, navFactory, ResourceCog, ResourceIcon, Timestamp, Selector, resourcePath, pluralize, LoadingInline} from './utils';
import { registerTemplate } from '../yaml-templates';
import { AsyncComponent } from './utils/async';

registerTemplate('v1beta2.EtcdCluster', `apiVersion: etcd.database.coreos.com/v1beta2
kind: EtcdCluster
metadata:
  name: example
spec:
  size: 3
  version: 3.1.4
`);

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
  const path = `/ns/${namespace}/etcdclusters/${name}`;

  return <span className="co-resource-link">
    <ResourceIcon kind="EtcdCluster" />
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

  return <ResourceRow obj={cluster}>
    <div className="col-md-3 col-sm-4 col-xs-6">
      <ResourceCog actions={menuActions} kind="EtcdCluster" resource={cluster} />
      <EtcdClusterLink metadata={metadata} />
    </div>
    <div className="col-md-2 col-sm-3 col-xs-6">
      {<Link to={`${resourcePath('etcdcluster', metadata.name, metadata.namespace)}/pods`} title="pods">
        {status ? `${status.size} of ${spec.size}` : spec.size}
      </Link>}
    </div>
    <div className="col-md-4 col-sm-5 hidden-xs">
      <Selector selector={selector} />
    </div>
    <div className="col-md-3 hidden-sm hidden-xs">
      {backup === null && <div className="text-muted">No backup policy</div>}
      {backup && <div>{_.has(status, 'backupServiceStatus') ? <Timestamp timestamp={status.backupServiceStatus.recentBackup.creationTime} /> : '-'}</div>}
    </div>
  </ResourceRow>;
};

const EtcdClusterHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-3 col-xs-6" sortField="status.size">Size</ColHead>
  <ColHead {...props} className="col-md-4 col-sm-5 hidden-xs" sortFunc="etcdClusterPodSelector">Pod Selector</ColHead>
  <ColHead {...props} className="col-md-3 hidden-sm hidden-xs" sortField="status.backupServiceStatus.recentBackup.creationTime">Last Backup Date</ColHead>
</ListHeader>;

const Phase = ({status}) => {
  if (status) {
    if (status.phase === 'Failed') {
      return <span><icon className="fa fa-ban phase-failed-icon" />&nbsp;{status.phase}</span>;
    }
    return <span>{status.phase}</span>;
  }
};

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
      resourceKind: k8sKinds.EtcdCluster,
      resource: this.props.obj,
      invalidateState: (isInvalid) => {
        this.setState({
          sizeCountOutdated: isInvalid
        });
      }
    });
  }

  render() {
    const cluster = this.props.obj;

    const metadata = cluster.metadata;
    const spec = cluster.spec;
    const status = cluster.status || null;
    const members = _.get(cluster.status, 'members', null);
    const specBackup = _.get(cluster.spec, 'backup', null);
    const statusBackup = _.get(cluster.status, 'backupServiceStatus', null);
    const readyMembers = _.get(members, 'ready.length', 0);
    const unreadyMembers = _.get(members, 'unready.length', 0);

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
                      <Tooltip content="Total number of etcd members that are ready/unready to serve requests">
                        {status ? pluralize(status.size, 'pod') : '-'}
                      </Tooltip>
                    </dd>
                  </dl>
                  <div className="co-detail-table__bracket"></div>
                  <div className="co-detail-table__breakdown">
                    <Tooltip content="Total number of etcd members that are ready to serve requests">
                      {readyMembers} ready
                    </Tooltip>
                    <Tooltip content="Total number of etcd members that are not ready to serve requests">
                      {unreadyMembers === 0 && readyMembers < spec.size ? spec.size - readyMembers : unreadyMembers} unready
                    </Tooltip>
                  </div>
                </div>}
              </div>
            </div>
          </div>
        </div>

        {status && status.phase === 'Failed' && <div className="co-m-pane__body-group">
          <div className="row no-gutter">
            <div className="phase-error-box">
              <p className="phase-error">
                {status.reason}
              </p>
            </div>
          </div>
        </div>}

        <div className="co-m-pane__body-group">
          <div className="row no-gutter">
            <div className="col-sm-8 col-xs-12">
              <div className="row">
                <div className="col-sm-6 col-xs-12">
                  <dt>Status</dt>
                  <dd>{status ? <Phase status={status} /> : '-'}</dd>
                  <dt>Name</dt>
                  <dd>{metadata.name}</dd>
                </div>
                <div className="col-sm-6 col-xs-12">
                  <dt>Desired Version</dt>
                  <dd>{spec.version}</dd>
                  <dt>Current Version</dt>
                  <dd>{status ? status.currentVersion : '-'}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {specBackup && <div className="co-m-pane__body">
        <div className="co-m-pane__body-section--bordered">
          <h1 className="co-section-title">Cluster Backup</h1>
          <div className="row no-gutter">
            <div className="col-sm-8 col-xs-12">
              <div className="row">
                <div className="col-sm-6 col-xs-12">
                  <dt>Backup Interval</dt>
                  <dd>{specBackup.backupIntervalInSecond}</dd>
                  <dt>Maximum Backups</dt>
                  <dd>{specBackup.maxBackups}</dd>
                  {statusBackup && <dt>Number of Backups</dt>}
                  {statusBackup && <dd>{statusBackup.backups}</dd>}
                </div>
                <div className="col-sm-6 col-xs-12">
                  <dt>Storage Type</dt>
                  <dd>{specBackup.storageType}</dd>
                  {specBackup.storageType === 'PersistentVolume' && <dt>Volume Size</dt>}
                  {specBackup.storageType === 'PersistentVolume' && <dd>{specBackup.pv.volumeSizeInMB} MB</dd>}
                  {statusBackup && <dt>Current Backup Size</dt>}
                  {statusBackup && <dd>{statusBackup.backupSize} MB</dd>}
                </div>
              </div>
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
                <div className="col-sm-2">Duration</div>
              </div>
              <div className="co-m-table-grid__body">
                <div className="row co-resource-list__item">
                  <div className="col-sm-4 col-xs-4"><Timestamp timestamp={statusBackup.recentBackup.creationTime} /></div>
                  <div className="col-sm-2">{statusBackup.recentBackup.size} MB</div>
                  <div className="col-sm-2">{statusBackup.recentBackup.version}</div>
                  <div className="col-sm-2">{statusBackup.recentBackup.timeTookInSecond}s</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>}
    </div>;
  }
}

class EtcdPodsComponent extends React.PureComponent {
  render() {
    const {metadata: {namespace, name}} = this.props.obj;
    return <PodsPage showTitle={false} namespace={namespace} selector={{matchLabels: {'etcd_cluster': name}}} />;
  }
}

const {details, editYaml, pods} = navFactory;
export const EtcdClustersDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[
    details(EtcdClusterDetails),
    editYaml((props) => <AsyncComponent loader={() => System.import('./edit-yaml').then(c => c.EditYAML)} obj={props.obj} kind="EtcdCluster" />),
    pods(EtcdPodsComponent)
  ]}
/>;

export const EtcdClusterList = props => <List {...props} Header={EtcdClusterHeader} Row={EtcdClusterRow} />;
export const EtcdClustersPage = props => <ListPage ListComponent={EtcdClusterList} canCreate={true} {...props} />;
