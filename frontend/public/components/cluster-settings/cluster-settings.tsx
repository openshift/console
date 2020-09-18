import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Button, Tooltip } from '@patternfly/react-core';
import { Link } from 'react-router-dom';

import {
  AddCircleOIcon,
  ArrowCircleUpIcon,
  SyncAltIcon,
  PencilAltIcon,
} from '@patternfly/react-icons';

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
  getClusterID,
  getClusterUpdateStatus,
  getClusterVersionCondition,
  getDesiredClusterVersion,
  getErrataLink,
  getLastCompletedUpdate,
  getOCMLink,
  k8sPatch,
  K8sResourceConditionStatus,
  K8sResourceKind,
  referenceForModel,
} from '../../module/k8s';
import {
  EmptyBox,
  ExternalLink,
  Firehose,
  HorizontalNav,
  ResourceLink,
  resourcePathFromModel,
  SectionHeading,
  Timestamp,
  truncateMiddle,
  useAccessReview,
} from '../utils';
import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared';

const cancelUpdate = (cv: ClusterVersionKind) => {
  k8sPatch(ClusterVersionModel, cv, [{ path: '/spec/desiredUpdate', op: 'remove' }]).catch(
    (err) => {
      const error = err.message;
      errorModal({ error });
    },
  );
};

export const clusterAutoscalerReference = referenceForModel(ClusterAutoscalerModel);

export const CurrentChannel: React.FC<CurrentChannelProps> = ({ cv, clusterVersionIsEditable }) => {
  const label = cv.spec.channel || '-';
  return clusterVersionIsEditable ? (
    <Button
      type="button"
      isInline
      data-test-id="current-channel-update-link"
      onClick={() => clusterChannelModal({ cv })}
      variant="link"
    >
      {label}
      <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
    </Button>
  ) : (
    <>{label}</>
  );
};

const InvalidMessage: React.SFC<CVStatusMessageProps> = ({ cv }) => (
  <>
    <div>
      <RedExclamationCircleIcon /> Invalid cluster version
    </div>
    <Button onClick={() => cancelUpdate(cv)} variant="primary">
      Cancel update
    </Button>
  </>
);

const UpdatesAvailableMessage: React.FC<CVStatusMessageProps> = ({
  cv,
  clusterVersionIsEditable,
}) => (
  <>
    <div className="co-update-status">
      <ArrowCircleUpIcon className="update-pending" /> Update available
    </div>
    {clusterVersionIsEditable && (
      <div>
        <Button onClick={() => clusterUpdateModal({ cv })} variant="primary">
          Update now
        </Button>
      </div>
    )}
  </>
);

const UpdatingMessage: React.SFC<CVStatusMessageProps> = ({ cv }) => {
  const updatingCondition = getClusterVersionCondition(
    cv,
    ClusterVersionConditionType.Progressing,
    K8sResourceConditionStatus.True,
  );
  return (
    <>
      {updatingCondition.message && (
        <div>
          <SyncAltIcon className="fa-spin" /> {updatingCondition.message}
        </div>
      )}
      <Link to="/settings/cluster/clusteroperators">View details</Link>
    </>
  );
};

const ErrorRetrievingMessage: React.SFC<CVStatusMessageProps> = ({ cv }) => {
  const retrievedUpdatesCondition = getClusterVersionCondition(
    cv,
    ClusterVersionConditionType.RetrievedUpdates,
    K8sResourceConditionStatus.False,
  );
  return retrievedUpdatesCondition.reason === 'NoChannel' ? (
    <span className="text-muted">No update channel selected</span>
  ) : (
    <Tooltip content={truncateMiddle(retrievedUpdatesCondition.message, { length: 256 })}>
      <span>
        <RedExclamationCircleIcon />{' '}
        {retrievedUpdatesCondition.reason === 'VersionNotFound'
          ? 'Version not found'
          : 'Error retrieving'}
      </span>
    </Tooltip>
  );
};

const FailingMessage: React.SFC<CVStatusMessageProps> = ({ cv }) => {
  const failingCondition = getClusterVersionCondition(
    cv,
    ClusterVersionConditionType.Failing,
    K8sResourceConditionStatus.True,
  );
  return (
    <>
      <div>
        <Tooltip content={truncateMiddle(failingCondition.message, { length: 256 })}>
          <span>
            <RedExclamationCircleIcon /> Failing
          </span>
        </Tooltip>
      </div>
      <Link to="/settings/cluster/clusteroperators">View details</Link>
    </>
  );
};

const UpToDateMessage: React.SFC<{}> = () => (
  <span>
    <GreenCheckCircleIcon /> Up to date
  </span>
);

export const UpdateStatus: React.FC<UpdateStatusProps> = ({ cv, clusterVersionIsEditable }) => {
  const status = getClusterUpdateStatus(cv);
  switch (status) {
    case ClusterUpdateStatus.Invalid:
      return <InvalidMessage cv={cv} />;
    case ClusterUpdateStatus.UpdatesAvailable:
      return (
        <UpdatesAvailableMessage cv={cv} clusterVersionIsEditable={clusterVersionIsEditable} />
      );
    case ClusterUpdateStatus.Updating:
      return <UpdatingMessage cv={cv} />;
    case ClusterUpdateStatus.ErrorRetrieving:
      return <ErrorRetrievingMessage cv={cv} />;
    case ClusterUpdateStatus.Failing:
      return <FailingMessage cv={cv} />;
    default:
      return <UpToDateMessage />;
  }
};

export const CurrentVersion: React.SFC<CurrentVersionProps> = ({ cv }) => {
  const desiredVersion = getDesiredClusterVersion(cv);
  const lastVersion = getLastCompletedUpdate(cv);
  const status = getClusterUpdateStatus(cv);

  if (status === ClusterUpdateStatus.UpToDate || status === ClusterUpdateStatus.UpdatesAvailable) {
    return desiredVersion ? (
      <span className="co-select-to-copy">{desiredVersion}</span>
    ) : (
      <>
        <YellowExclamationTriangleIcon />
        &nbsp;Unknown
      </>
    );
  }

  return lastVersion ? <span className="co-select-to-copy">{lastVersion}</span> : <>None</>;
};

export const UpdateLink: React.FC<CurrentVersionProps> = ({ cv, clusterVersionIsEditable }) => {
  const status = getClusterUpdateStatus(cv);
  const updatesAvailable = !_.isEmpty(getAvailableClusterUpdates(cv));
  return (
    <>
      {updatesAvailable &&
      (status === ClusterUpdateStatus.ErrorRetrieving ||
        status === ClusterUpdateStatus.Failing ||
        status === ClusterUpdateStatus.Updating) &&
      clusterVersionIsEditable ? (
        <Button variant="link" type="button" onClick={() => clusterUpdateModal({ cv })}>
          Update to another version
        </Button>
      ) : null}
    </>
  );
};

export const CurrentVersionHeader: React.SFC<CurrentVersionProps> = ({ cv }) => {
  const status = getClusterUpdateStatus(cv);
  return (
    <>
      {status === ClusterUpdateStatus.UpToDate || status === ClusterUpdateStatus.UpdatesAvailable
        ? 'Current Version'
        : 'Last Completed Version'}
    </>
  );
};

export const ClusterVersionDetailsTable: React.FC<ClusterVersionDetailsTableProps> = ({
  obj: cv,
  autoscalers,
}) => {
  const { history = [] } = cv.status;
  const clusterID = getClusterID(cv);
  const errataLink = getErrataLink(cv);
  const desiredImage: string = _.get(cv, 'status.desired.image') || '';
  // Split image on `@` to emphasize the digest.
  const imageParts = desiredImage.split('@');
  const clusterVersionIsEditable =
    useAccessReview({
      group: ClusterVersionModel.apiGroup,
      resource: ClusterVersionModel.plural,
      verb: 'patch',
      name: cv.metadata.name,
    }) && window.SERVER_FLAGS.branding !== 'dedicated';

  return (
    <>
      <div className="co-m-pane__body">
        <div className="co-m-pane__body-group">
          <div className="co-detail-table co-detail-table--lg">
            <div className="co-detail-table__row row">
              <div className="co-detail-table__section col-sm-4 col-md-3">
                <dl className="co-m-pane__details">
                  <dt className="co-detail-table__section-header">Channel</dt>
                  <dd>
                    <CurrentChannel cv={cv} clusterVersionIsEditable={clusterVersionIsEditable} />
                  </dd>
                </dl>
              </div>
              <div className="co-detail-table__section col-sm-4 col-md-4">
                <dl className="co-m-pane__details">
                  <dt className="co-detail-table__section-header">
                    <CurrentVersionHeader cv={cv} />
                  </dt>
                  <dd>
                    <div>
                      <CurrentVersion cv={cv} />
                    </div>
                    <UpdateLink cv={cv} clusterVersionIsEditable={clusterVersionIsEditable} />
                  </dd>
                </dl>
              </div>
              <div className="co-detail-table__section col-sm-4 col-md-4">
                <dl className="co-m-pane__details">
                  <dt className="co-detail-table__section-header">Update Status</dt>
                  <dd>
                    <UpdateStatus cv={cv} clusterVersionIsEditable={clusterVersionIsEditable} />
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="co-m-pane__body-group">
          {window.SERVER_FLAGS.branding !== 'okd' && window.SERVER_FLAGS.branding !== 'azure' && (
            <p className="co-m-pane__explanation">
              View this cluster and manage subscription settings in{' '}
              <ExternalLink text="OpenShift Cluster Manager" href={getOCMLink(clusterID)} />.
            </p>
          )}
          <dl className="co-m-pane__details">
            <dt>Cluster ID</dt>
            <dd className="co-break-all co-select-to-copy" data-test-id="cv-details-table-cid">
              {clusterID}
            </dd>
            <dt>Desired Release Image</dt>
            <dd className="co-break-all co-select-to-copy" data-test-id="cv-details-table-image">
              {imageParts.length === 2 ? (
                <>
                  <span className="text-muted">{imageParts[0]}@</span>
                  {imageParts[1]}
                </>
              ) : (
                desiredImage || '-'
              )}
            </dd>
            <dt>Cluster Version Configuration</dt>
            <dd>
              <ResourceLink kind={referenceForModel(ClusterVersionModel)} name={cv.metadata.name} />
            </dd>
            <dt>Cluster Autoscaler</dt>
            <dd>
              {_.isEmpty(autoscalers) ? (
                <Link to={`${resourcePathFromModel(ClusterAutoscalerModel)}/~new`}>
                  <AddCircleOIcon className="co-icon-space-r" />
                  Create Autoscaler
                </Link>
              ) : (
                autoscalers.map((autoscaler) => (
                  <div key={autoscaler.metadata.uid}>
                    <ResourceLink
                      kind={clusterAutoscalerReference}
                      name={autoscaler.metadata.name}
                    />
                  </div>
                ))
              )}
            </dd>
          </dl>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Update History">
          {errataLink && (
            <small>
              <ExternalLink text="View errata" href={errataLink} />
            </small>
          )}
        </SectionHeading>
        {_.isEmpty(history) ? (
          <EmptyBox label="History" />
        ) : (
          <div className="co-table-container">
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
                {_.map(history, (update, i) => (
                  <tr key={i}>
                    <td
                      className="co-break-all co-select-to-copy"
                      data-test-id="cv-details-table-version"
                    >
                      {update.version || '-'}
                    </td>
                    <td data-test-id="cv-details-table-state">{update.state || '-'}</td>
                    <td>
                      <Timestamp timestamp={update.startedTime} />
                    </td>
                    <td>
                      {update.completionTime ? (
                        <Timestamp timestamp={update.completionTime} />
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export const ClusterOperatorTabPage: React.SFC<ClusterOperatorTabPageProps> = ({ obj: cv }) => (
  <ClusterOperatorPage cv={cv} autoFocus={false} showTitle={false} />
);

const pages = [
  {
    href: '',
    name: 'Details',
    component: ClusterVersionDetailsTable,
  },
  {
    href: 'clusteroperators',
    name: 'Cluster Operators',
    component: ClusterOperatorTabPage,
  },
  {
    href: 'globalconfig',
    name: 'Global Configuration',
    component: GlobalConfigPage,
  },
];

export const ClusterSettingsPage: React.SFC<ClusterSettingsPageProps> = ({ match }) => {
  const title = 'Cluster Settings';
  const resources = [
    { kind: clusterVersionReference, name: 'version', isList: false, prop: 'obj' },
    { kind: clusterAutoscalerReference, isList: true, prop: 'autoscalers', optional: true },
  ];
  const resourceKeys = _.map(resources, 'prop');
  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div className="co-m-nav-title">
        <h1 className="co-m-pane__heading" data-test-id="cluster-settings-page-heading">
          {title}
        </h1>
      </div>
      <Firehose resources={resources}>
        <HorizontalNav pages={pages} match={match} resourceKeys={resourceKeys} />
      </Firehose>
    </>
  );
};

type UpdateStatusProps = {
  cv: ClusterVersionKind;
  clusterVersionIsEditable: boolean;
};

type CVStatusMessageProps = {
  cv: ClusterVersionKind;
  clusterVersionIsEditable?: boolean;
};

type CurrentChannelProps = {
  cv: K8sResourceKind;
  clusterVersionIsEditable: boolean;
};

type CurrentVersionProps = {
  cv: ClusterVersionKind;
  clusterVersionIsEditable?: boolean;
};

type ClusterVersionDetailsTableProps = {
  obj: ClusterVersionKind;
  autoscalers: K8sResourceKind[];
};

type ClusterSettingsPageProps = {
  match: any;
};

type ClusterOperatorTabPageProps = {
  obj: ClusterVersionKind;
};
