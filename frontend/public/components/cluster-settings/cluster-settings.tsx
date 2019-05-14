import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Button } from 'patternfly-react';
import { Link } from 'react-router-dom';

import { ClusterOperatorPage } from './cluster-operator';
import { clusterChannelModal, clusterUpdateModal, errorModal } from '../modals';
import { GlobalConfigPage } from './global-config';
import { ClusterAutoscalerModel, ClusterVersionModel } from '../../models';
import {
  ClusterUpdateStatus,
  ClusterVersionConditionType,
  ClusterVersionKind,
  clusterVersionReference,
  getAvailableClusterUpdates,
  getClusterUpdateStatus,
  getClusterVersionCondition,
  getDesiredClusterVersion,
  getLastCompletedUpdate,
  k8sPatch,
  K8sResourceConditionStatus,
  K8sResourceKind,
  referenceForModel,
} from '../../module/k8s';
import {
  EmptyBox,
  Firehose,
  HorizontalNav,
  ResourceLink,
  resourcePathFromModel,
  SectionHeading,
  Timestamp,
} from '../utils';

const cancelUpdate = (cv: ClusterVersionKind) => {
  k8sPatch(ClusterVersionModel, cv, [{path: '/spec/desiredUpdate', op: 'remove'}]).catch(err => {
    const error = err.message;
    errorModal({error});
  });
};

const clusterAutoscalerReference = referenceForModel(ClusterAutoscalerModel);

const CurrentChannel: React.SFC<CurrentChannelProps> = ({cv}) => <button className="btn btn-link co-modal-btn-link" onClick={() => clusterChannelModal({cv})}>
  {cv.spec.channel || '-'}
</button>;

const InvalidMessage: React.SFC<CVStatusMessageProps> = ({cv}) => <React.Fragment>
  <div>
    <i className="pficon pficon-error-circle-o" aria-hidden={true} /> Invalid cluster version
  </div>
  <Button bsStyle="primary" onClick={() => cancelUpdate(cv)}>
    Cancel update
  </Button>
</React.Fragment>;

const UpdatesAvailableMessage: React.SFC<CVStatusMessageProps> = ({cv}) => <React.Fragment>
  <div className="co-update-status">
    <i className="fa fa-arrow-circle-o-up update-pending" aria-hidden={true} /> Update available
  </div>
  <div>
    <Button bsStyle="primary" onClick={() => clusterUpdateModal(cv)}>
      Update now
    </Button>
  </div>
</React.Fragment>;

const UpdatingMessage: React.SFC<CVStatusMessageProps> = ({cv}) => {
  const updatingCondition = getClusterVersionCondition(cv, ClusterVersionConditionType.Progressing, K8sResourceConditionStatus.True);
  return <React.Fragment>
    {updatingCondition.message && <div><i className="fa-spin fa fa-refresh" aria-hidden={true} /> {updatingCondition.message}</div>}
    <Link to="/settings/cluster/clusteroperators">View details</Link>
  </React.Fragment>;
};

const ErrorRetrievingMessage: React.SFC<{}> = () => <div>
  <i className="pficon pficon-error-circle-o" aria-hidden={true} /> Error retrieving
</div>;

const FailingMessage: React.SFC<{}> = () => <React.Fragment>
  <div>
    <i className="pficon pficon-error-circle-o" aria-hidden={true} /> Failing
  </div>
  <Link to="/settings/cluster/clusteroperators">View details</Link>
</React.Fragment>;

const UpToDateMessage: React.SFC<{}> = () => <span>
  <i className="pficon pficon-ok" aria-hidden={true} /> Up to date
</span>;

const UpdateStatus: React.SFC<UpdateStatusProps> = ({cv}) => {
  const status = getClusterUpdateStatus(cv);
  switch (status) {
    case ClusterUpdateStatus.Invalid:
      return <InvalidMessage cv={cv} />;
    case ClusterUpdateStatus.UpdatesAvailable:
      return <UpdatesAvailableMessage cv={cv} />;
    case ClusterUpdateStatus.Updating:
      return <UpdatingMessage cv={cv} />;
    case ClusterUpdateStatus.ErrorRetrieving:
      return <ErrorRetrievingMessage />;
    case ClusterUpdateStatus.Failing:
      return <FailingMessage />;
    default:
      return <UpToDateMessage />;
  }
};

const CurrentVersion: React.SFC<CurrentVersionProps> = ({cv}) => {
  const desiredVersion = getDesiredClusterVersion(cv);
  const lastVersion = getLastCompletedUpdate(cv);
  const status = getClusterUpdateStatus(cv);

  if (status === ClusterUpdateStatus.UpToDate || status === ClusterUpdateStatus.UpdatesAvailable) {
    return desiredVersion
      ? <React.Fragment>{desiredVersion}</React.Fragment>
      : <React.Fragment><i className="pficon pficon-warning-triangle-o" aria-hidden="true" />&nbsp;Unknown</React.Fragment>;
  }

  return <React.Fragment>{lastVersion || 'None'}</React.Fragment>;
};

const UpdateLink: React.SFC<CurrentVersionProps> = ({cv}) => {
  const status = getClusterUpdateStatus(cv);
  const updatesAvailable = !_.isEmpty(getAvailableClusterUpdates(cv));
  return <React.Fragment>
    {
      updatesAvailable && status === ClusterUpdateStatus.ErrorRetrieving || status === ClusterUpdateStatus.Failing || status === ClusterUpdateStatus.Updating
        ? <Button bsStyle="link" className="btn-link--no-btn-default-values" onClick={() => (clusterUpdateModal({cv}))}>Update to another version</Button>
        : null
    }
  </React.Fragment>;
};

const CurrentVersionHeader: React.SFC<CurrentVersionProps> = ({cv}) => {
  const status = getClusterUpdateStatus(cv);
  return <React.Fragment>
    { status === ClusterUpdateStatus.UpToDate || status === ClusterUpdateStatus.UpdatesAvailable ? 'Current Version' : 'Last Completed Version' }
  </React.Fragment>;
};

const ClusterVersionDetailsTable: React.SFC<ClusterVersionDetailsTableProps> = ({obj: cv, autoscalers}) => {
  const { history = [] } = cv.status;
  const desiredImage: string = _.get(cv, 'status.desired.image') || '';
  // Split image on `@` to emphasize the digest.
  const imageParts = desiredImage.split('@');

  return <React.Fragment>
    <div className="co-m-pane__body">
      <div className="co-m-pane__body-group">
        <div className="co-detail-table co-detail-table--lg">
          <div className="co-detail-table__row row">
            <div className="co-detail-table__section col-sm-4 col-md-3">
              <dl className="co-m-pane__details">
                <dt className="co-detail-table__section-header">Channel</dt>
                <dd><CurrentChannel cv={cv} /></dd>
              </dl>
            </div>
            <div className="co-detail-table__section col-sm-4 col-md-4">
              <dl className="co-m-pane__details">
                <dt className="co-detail-table__section-header"><CurrentVersionHeader cv={cv} /></dt>
                <dd>
                  <div><CurrentVersion cv={cv} /></div>
                  <UpdateLink cv={cv} />
                </dd>
              </dl>
            </div>
            <div className="co-detail-table__section col-sm-4 col-md-4">
              <dl className="co-m-pane__details">
                <dt className="co-detail-table__section-header">Update Status</dt>
                <dd><UpdateStatus cv={cv} /></dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body-group">
        <dl className="co-m-pane__details">
          <dt>Cluster ID</dt>
          <dd className="co-break-all">{cv.spec.clusterID}</dd>
          <dt>Desired Release Image</dt>
          <dd>
            {imageParts.length === 2
              ? <React.Fragment><span className="text-muted">{imageParts[0]}@</span>{imageParts[1]}</React.Fragment>
              : desiredImage || '-'}
          </dd>
          <dt>Cluster Version Configuration</dt>
          <dd>
            <ResourceLink kind={referenceForModel(ClusterVersionModel)} name={cv.metadata.name} />
          </dd>
          <dt>Cluster Autoscaler</dt>
          <dd>
            {_.isEmpty(autoscalers)
              ? <Link to={`${resourcePathFromModel(ClusterAutoscalerModel)}/~new`}>
                <i className="pficon pficon-add-circle-o" aria-hidden="true" /> Create Autoscaler
              </Link>
              : autoscalers.map(autoscaler => <div key={autoscaler.metadata.uid}><ResourceLink kind={clusterAutoscalerReference} name={autoscaler.metadata.name} /></div>)}
          </dd>
        </dl>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Update History" />
      {_.isEmpty(history)
        ? <EmptyBox label="History" />
        : <div className="co-table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Version</th>
                <th>State</th>
                <th>Started</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {_.map(history, (update, i) => <tr key={i}>
                <td className="co-break-all">{update.version || '-'}</td>
                <td>{update.state || '-'}</td>
                <td><Timestamp timestamp={update.startedTime} /></td>
                <td>{update.completionTime ? <Timestamp timestamp={update.completionTime} /> : '-'}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      }
    </div>
  </React.Fragment>;
};

const ClusterOperatorTabPage: React.SFC = () => <ClusterOperatorPage autoFocus={false} showTitle={false} />;

const pages = [{
  href: '',
  name: 'Overview',
  component: ClusterVersionDetailsTable,
}, {
  href: 'globalconfig',
  name: 'Global Configuration',
  component: GlobalConfigPage,
}, {
  href: 'clusteroperators',
  name: 'Cluster Operators',
  component: ClusterOperatorTabPage,
}];

export const ClusterSettingsPage: React.SFC<ClusterSettingsPageProps> = ({match}) => {
  const title = 'Cluster Settings';
  const resources = [
    {kind: clusterVersionReference, name: 'version', isList: false, prop: 'obj'},
    {kind: clusterAutoscalerReference, isList: true, prop: 'autoscalers', optional: true},
  ];
  const resourceKeys = _.map(resources, 'prop');
  return <React.Fragment>
    <Helmet>
      <title>{title}</title>
    </Helmet>
    <div className="co-m-nav-title">
      <h1 className="co-m-pane__heading">{title}</h1>
    </div>
    <Firehose forceUpdate resources={resources}>
      <HorizontalNav pages={pages} match={match} resourceKeys={resourceKeys} hideDivider />
    </Firehose>
  </React.Fragment>;
};

type UpdateStatusProps = {
  cv: ClusterVersionKind;
};

type CVStatusMessageProps = {
  cv: ClusterVersionKind;
};

type CurrentChannelProps = {
  cv: K8sResourceKind;
};

type CurrentVersionProps = {
  cv: ClusterVersionKind;
};

type ClusterVersionDetailsTableProps = {
  obj: ClusterVersionKind;
  autoscalers: K8sResourceKind[];
};

type ClusterSettingsPageProps = {
  match: any;
};
