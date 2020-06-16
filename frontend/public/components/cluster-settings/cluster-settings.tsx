import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import * as semver from 'semver';
import { Helmet } from 'react-helmet';
import { Button, Popover, Tooltip } from '@patternfly/react-core';
import { Link } from 'react-router-dom';

import {
  AddCircleOIcon,
  ArrowCircleUpIcon,
  SyncAltIcon,
  PencilAltIcon,
} from '@patternfly/react-icons';

import { ClusterOperatorPage } from './cluster-operator';
import {
  clusterChannelModal,
  clusterMoreUpdatesModal,
  clusterUpdateModal,
  errorModal,
} from '../modals';
import { GlobalConfigPage } from './global-config';
import { ClusterAutoscalerModel, ClusterVersionModel } from '../../models';
import {
  ClusterUpdateStatus,
  ClusterVersionConditionType,
  ClusterVersionKind,
  clusterVersionReference,
  getAvailableClusterChannels,
  getAvailableClusterUpdates,
  getClusterID,
  getClusterUpdateStatus,
  getClusterVersionCondition,
  getDesiredClusterVersion,
  getErrataLink,
  getLastCompletedUpdate,
  getOCMLink,
  getSortedUpdates,
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

export const CurrentChannel: React.SFC<CurrentChannelProps> = ({ cv }) => (
  <Button
    type="button"
    isInline
    data-test-id="current-channel-update-link"
    onClick={() => clusterChannelModal({ cv })}
    variant="link"
  >
    {cv.spec.channel || '-'}
    <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
  </Button>
);

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

const UpdatesAvailableMessage: React.SFC<CVStatusMessageProps> = () => (
  <div className="co-update-status">
    <ArrowCircleUpIcon className="update-pending" /> Available Updates
  </div>
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
          <SyncAltIcon className="fa-spin co-icon-space-r" />
          {updatingCondition.message}
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

export const UpdateStatus: React.SFC<UpdateStatusProps> = ({ cv }) => {
  const status = getClusterUpdateStatus(cv);
  switch (status) {
    case ClusterUpdateStatus.Invalid:
      return <InvalidMessage cv={cv} />;
    case ClusterUpdateStatus.UpdatesAvailable:
      return <UpdatesAvailableMessage cv={cv} />;
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

export const UpdateLink: React.SFC<CurrentVersionProps> = ({ cv }) => {
  const status = getClusterUpdateStatus(cv);
  const updatesAvailable = !_.isEmpty(getAvailableClusterUpdates(cv));
  return (
    <>
      {updatesAvailable &&
      (status === ClusterUpdateStatus.ErrorRetrieving ||
        status === ClusterUpdateStatus.Failing ||
        status === ClusterUpdateStatus.UpdatesAvailable ||
        status === ClusterUpdateStatus.Updating) ? (
        <Button variant="primary" type="button" onClick={() => clusterUpdateModal({ cv })}>
          Update
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

const ChannelHeader: React.FC<{}> = () => {
  return (
    <Popover
      headerContent={<>Channel</>}
      bodyContent={
        <>
          <p>
            Channels help to control the pace of updates and recommend the appropriate release
            versions. Update channels are tied to a minor version of OpenShift Container Platform,
            for example 4.5
          </p>
          <ExternalLink
            href="https://docs.openshift.com/container-platform/latest/updating/updating-cluster-between-minor.html#understanding-upgrade-channels_updating-cluster-between-minor"
            text="Learn more about OpenShift update channels"
          />
        </>
      }
    >
      <Button variant="plain" className="co-m-pane__details-popover-button">
        Channel
      </Button>
    </Popover>
  );
};

const Channel: React.FC<ChannelProps> = ({ children, endOfLife }) => {
  return (
    <div
      className={classNames('co-channel', {
        'co-channel--end-of-life': endOfLife,
      })}
    >
      {children}
    </div>
  );
};

const ChannelLine: React.FC<ChannelLineProps> = ({ children, start }) => {
  return (
    <li className={classNames('co-channel-line', { 'co-channel-start': start })}>{children}</li>
  );
};

const ChannelName: React.FC<ChannelNameProps> = ({ children, current }) => {
  return (
    <span
      className={classNames('co-channel-name', {
        'co-channel-name--current': current,
      })}
    >
      {children}
    </span>
  );
};

const ChannelPath: React.FC<ChannelPathProps> = ({ children, current }) => {
  return (
    <ul
      className={classNames('co-channel-path', {
        'co-channel-path--current': current,
      })}
    >
      {children}
    </ul>
  );
};

const ChannelVersion: React.FC<ChannelVersionProps> = ({ children, current }) => {
  return (
    <span
      className={classNames('co-channel-version', {
        'co-channel-version--current': current,
      })}
    >
      {children}
    </span>
  );
};

const ChannelVersionDot: React.FC<ChannelVersionDotProps> = ({ current }) => {
  return (
    <div
      className={classNames('co-channel-version-dot', {
        'co-channel-version-dot--current': current,
      })}
    ></div>
  );
};

const splitChannel = (channel: string) => {
  const parsed = /^(.+)-(\d\.\d+)$/.exec(channel);
  return parsed ? { prefix: parsed[1], version: parsed[2] } : null;
};

const UpdatesGraph: React.FC<UpdatesGraphProps> = ({ cv }) => {
  const status = getClusterUpdateStatus(cv);
  const availableUpdates = getSortedUpdates(cv);
  const upToDate = status === ClusterUpdateStatus.UpToDate;
  const desiredVersion = getDesiredClusterVersion(cv);
  const lastVersion = getLastCompletedUpdate(cv);
  const newestVersion = availableUpdates[0]?.version;
  const secondNewestVersion = availableUpdates[1]?.version;
  const currentChannel = cv.spec.channel;
  const currentPrefix = splitChannel(currentChannel)?.prefix;
  const similarChannels = _.keys(getAvailableClusterChannels()).filter((channel: string) => {
    return currentPrefix && splitChannel(channel)?.prefix === currentPrefix;
  });
  const newerChannel = similarChannels.find(
    // find the next minor version, which there should never be more than one
    (channel) => semver.gt(semver.coerce(channel).version, semver.coerce(currentChannel).version),
  );

  return (
    status !== ClusterUpdateStatus.ErrorRetrieving && (
      <div className="co-cluster-settings__updates-graph">
        <Channel>
          <ChannelPath current>
            {/* Segment 1 */}
            <ChannelLine>
              <ChannelVersion current>{lastVersion}</ChannelVersion>
              <ChannelVersionDot current />
            </ChannelLine>
            {/* Segment 2 */}
            {(upToDate || availableUpdates.length < 2) && <ChannelLine />}
            {availableUpdates.length === 2 && (
              <ChannelLine>
                <ChannelVersion>{secondNewestVersion}</ChannelVersion>
                <ChannelVersionDot />
              </ChannelLine>
            )}
            {availableUpdates.length > 2 && (
              <ChannelLine>
                <Button
                  variant="secondary"
                  className="co-channel-more-versions"
                  onClick={() => clusterMoreUpdatesModal({ cv })}
                >
                  + More
                </Button>
              </ChannelLine>
            )}
            {/* Segment 3 */}
            {upToDate ? (
              <ChannelLine />
            ) : (
              (newestVersion || status === ClusterUpdateStatus.Updating) && (
                <ChannelLine>
                  <ChannelVersion>{newestVersion || desiredVersion}</ChannelVersion>
                  <ChannelVersionDot />
                </ChannelLine>
              )
            )}
          </ChannelPath>
          <ChannelName current>{currentChannel} channel</ChannelName>
        </Channel>
        {newerChannel && (
          <Channel>
            <ChannelPath>
              <ChannelLine start={true}>
                <div className="co-channel-switch"></div>
              </ChannelLine>
              <ChannelLine />
              <ChannelLine />
            </ChannelPath>
            <ChannelName>{newerChannel} channel</ChannelName>
          </Channel>
        )}
      </div>
    )
  );
};

export const ClusterVersionDetailsTable: React.SFC<ClusterVersionDetailsTableProps> = ({
  obj: cv,
  autoscalers,
}) => {
  const { history = [] } = cv.status;
  const clusterID = getClusterID(cv);
  const errataLink = getErrataLink(cv);
  const desiredImage: string = _.get(cv, 'status.desired.image') || '';
  // Split image on `@` to emphasize the digest.
  const imageParts = desiredImage.split('@');

  return (
    <>
      <div className="co-m-pane__body">
        <div className="co-m-pane__body-group">
          <div className="co-cluster-settings">
            <div className="co-cluster-settings__row">
              <div className="co-cluster-settings__section co-cluster-settings__section--current">
                <dl className="co-m-pane__details co-cluster-settings__details">
                  <dt>
                    <CurrentVersionHeader cv={cv} />
                  </dt>
                  <dd>
                    <CurrentVersion cv={cv} />
                  </dd>
                </dl>
              </div>
              <div className="co-cluster-settings__section">
                <div className="co-cluster-settings__row">
                  <dl className="co-m-pane__details co-cluster-settings__details co-cluster-settings__details--status">
                    <dt>Update Status</dt>
                    <dd>
                      <UpdateStatus cv={cv} />
                    </dd>
                  </dl>
                  <div className="co-cluster-settings__row">
                    <dl className="co-m-pane__details co-cluster-settings__details">
                      <dt>
                        <ChannelHeader />
                      </dt>
                      <dd>
                        <CurrentChannel cv={cv} />
                      </dd>
                    </dl>
                    <div className="co-cluster-settings__details">
                      <UpdateLink cv={cv} />
                    </div>
                  </div>
                </div>
                <UpdatesGraph cv={cv} />
              </div>
            </div>
          </div>
        </div>
        <div className="co-m-pane__body-group">
          <dl className="co-m-pane__details">
            {window.SERVER_FLAGS.branding !== 'okd' && window.SERVER_FLAGS.branding !== 'azure' && (
              <>
                <dt>Subscription</dt>
                <dd>
                  <ExternalLink text="OpenShift Cluster Manager" href={getOCMLink(clusterID)} />.
                </dd>
              </>
            )}
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

type ChannelProps = {
  children: React.ReactNode;
  endOfLife?: boolean;
};

type ChannelLineProps = {
  children?: React.ReactNode;
  start?: boolean;
};

type ChannelNameProps = {
  children: React.ReactNode;
  current?: boolean;
};

type ChannelPathProps = {
  children: React.ReactNode;
  current?: boolean;
};

type ChannelVersionProps = {
  children: React.ReactNode;
  current?: boolean;
};

type ChannelVersionDotProps = {
  current?: boolean;
};

type UpdatesGraphProps = {
  cv: ClusterVersionKind;
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
