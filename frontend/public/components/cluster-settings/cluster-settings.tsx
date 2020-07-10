import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import * as semver from 'semver';
import { Helmet } from 'react-helmet';
import {
  Button,
  Popover,
  Progress,
  ProgressSize,
  ProgressVariant,
  Tooltip,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

import { AddCircleOIcon, SyncAltIcon, PencilAltIcon } from '@patternfly/react-icons';
import { BlueInfoCircleIcon } from '@console/shared/src/components/status';

import { ClusterOperatorPage } from './cluster-operator';
import {
  clusterChannelModal,
  clusterMoreUpdatesModal,
  clusterUpdateModal,
  errorModal,
} from '../modals';
import { GlobalConfigPage } from './global-config';
import {
  ClusterAutoscalerModel,
  ClusterOperatorModel,
  ClusterVersionModel,
  MachineConfigPoolModel,
} from '../../models';
import {
  ClusterOperator,
  ClusterUpdateStatus,
  ClusterVersionConditionType,
  ClusterVersionKind,
  clusterVersionReference,
  getAvailableClusterChannels,
  getAvailableClusterUpdates,
  getClusterID,
  getClusterOperatorVersion,
  getClusterUpdateStatus,
  getClusterVersionCondition,
  getCurrentVersion,
  getDesiredClusterVersion,
  getLastCompletedUpdate,
  getOCMLink,
  getReleaseNotesLink,
  getSortedUpdates,
  k8sPatch,
  K8sResourceConditionStatus,
  K8sResourceKind,
  MachineConfigPoolConditionType,
  MachineConfigPoolKind,
  referenceForModel,
  showReleaseNotes,
  UpdateHistory,
} from '../../module/k8s';
import {
  EmptyBox,
  ExternalLink,
  Firehose,
  HorizontalNav,
  openshiftHelpBase,
  ResourceLink,
  resourcePathFromModel,
  SectionHeading,
  Timestamp,
  truncateMiddle,
} from '../utils';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import {
  BlueArrowCircleUpIcon,
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

const getMCPByName = (
  machineConfigPools: MachineConfigPoolKind[],
  name: string,
): MachineConfigPoolKind => {
  return machineConfigPools?.find((mcp) => mcp.metadata.name === name);
};

const getStartedTimeForCVDesiredVersion = (
  cv: ClusterVersionKind,
  desiredVersion: string,
): string => {
  const desiredHistory: UpdateHistory = cv?.status?.history?.find(
    (update) => update.version === desiredVersion,
  );
  return desiredHistory?.startedTime;
};

const getUpdatingTimeForMCP = (machineConfigPool: MachineConfigPoolKind): string => {
  const updatingCondition = machineConfigPool?.status?.conditions.find(
    (condition) => condition.type === MachineConfigPoolConditionType.Updating,
  );
  return updatingCondition?.lastTransitionTime;
};

const getUpdatedOperatorsCount = (
  clusterOperators: ClusterOperator[],
  desiredVersion: string,
): number => {
  return (
    clusterOperators?.filter((operator) => {
      return getClusterOperatorVersion(operator) === desiredVersion;
    })?.length ?? 0
  );
};

const calculatePercentage = (numerator: number, denominator: number): number =>
  Math.round((numerator / denominator) * 100);

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
    <BlueArrowCircleUpIcon /> Available Updates
  </div>
);

const FailingMessageText: React.FC<CVStatusMessageProps> = ({ cv }) => {
  const failingCondition = getClusterVersionCondition(
    cv,
    ClusterVersionConditionType.Failing,
    K8sResourceConditionStatus.True,
  );
  return (
    <div>
      <Tooltip content={truncateMiddle(failingCondition.message, { length: 256 })}>
        <span>
          <RedExclamationCircleIcon /> Failing
        </span>
      </Tooltip>
    </div>
  );
};

export const ClusterVersionConditionsLink: React.FC<ClusterVersionConditionsLinkProps> = ({
  cv,
}) => (
  <HashLink
    smooth
    to={`${resourcePathFromModel(ClusterVersionModel, cv.metadata.name)}#conditions`}
  >
    View conditions
  </HashLink>
);

export const UpdatingMessageText: React.FC<CVStatusMessageProps> = ({ cv }) => {
  const version = getDesiredClusterVersion(cv);
  return <>Update to {version} in progress</>;
};

const UpdatingMessage: React.FC<CVStatusMessageProps> = ({ cv, isFailing }) => {
  return (
    <>
      <div>
        <SyncAltIcon className="fa-spin co-icon-space-r" />
        <UpdatingMessageText cv={cv} />
      </div>
      {isFailing && <FailingMessageText cv={cv} />}
      <ClusterVersionConditionsLink cv={cv} />
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

const FailingMessage: React.FC<CVStatusMessageProps> = ({ cv }) => {
  return (
    <>
      <FailingMessageText cv={cv} />
      <ClusterVersionConditionsLink cv={cv} />
    </>
  );
};

const UpToDateMessage: React.SFC<{}> = () => (
  <span>
    <GreenCheckCircleIcon /> Up to date
  </span>
);

export const UpdateStatus: React.FC<UpdateStatusProps> = ({ cv }) => {
  const status = getClusterUpdateStatus(cv);
  switch (status) {
    case ClusterUpdateStatus.Invalid:
      return <InvalidMessage cv={cv} />;
    case ClusterUpdateStatus.UpdatesAvailable:
      return <UpdatesAvailableMessage cv={cv} />;
    case ClusterUpdateStatus.Updating:
      return <UpdatingMessage cv={cv} />;
    case ClusterUpdateStatus.UpdatingAndFailing:
      return <UpdatingMessage cv={cv} isFailing />;
    case ClusterUpdateStatus.ErrorRetrieving:
      return <ErrorRetrievingMessage cv={cv} />;
    case ClusterUpdateStatus.Failing:
      return <FailingMessage cv={cv} />;
    default:
      return <UpToDateMessage />;
  }
};

export const ReleaseNotesLink: React.FC<ReleaseNotesLinkProps> = ({ version }) => {
  const releaseNotesLink = getReleaseNotesLink(version);
  return releaseNotesLink && <ExternalLink text="View release notes" href={releaseNotesLink} />;
};

export const CurrentVersion: React.SFC<CurrentVersionProps> = ({ cv }) => {
  const desiredVersion = getDesiredClusterVersion(cv);
  const lastVersion = getLastCompletedUpdate(cv);
  const status = getClusterUpdateStatus(cv);

  if (status === ClusterUpdateStatus.UpToDate || status === ClusterUpdateStatus.UpdatesAvailable) {
    return desiredVersion ? (
      <>
        <div>
          <span className="co-select-to-copy" data-test-id="cluster-version">
            {desiredVersion}
          </span>
        </div>
        <ReleaseNotesLink version={getCurrentVersion(cv)} />
      </>
    ) : (
      <>
        <YellowExclamationTriangleIcon />
        &nbsp;Unknown
      </>
    );
  }

  return lastVersion ? (
    <>
      <div>
        <span className="co-select-to-copy" data-test-id="cluster-version">
          {lastVersion}
        </span>
      </div>
      <ReleaseNotesLink version={getLastCompletedUpdate(cv)} />
    </>
  ) : (
    <>None</>
  );
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
        <div className="co-cluster-settings__details">
          <Button variant="primary" type="button" onClick={() => clusterUpdateModal({ cv })}>
            Update
          </Button>
        </div>
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

export const ChannelDocLink: React.FC<{}> = () => (
  <ExternalLink
    href={`${openshiftHelpBase}updating/updating-cluster-between-minor.html#understanding-upgrade-channels_updating-cluster-between-minor`}
    text="Learn more about OpenShift update channels"
  />
);

const ChannelHeader: React.FC<{}> = () => {
  return (
    <Popover
      headerContent={<>Channel</>}
      bodyContent={
        <>
          <p>
            Channels help to control the pace of updates and recommend the appropriate release
            versions. Update channels are tied to a minor version of OpenShift Container Platform,
            for example 4.5.
          </p>
          <ChannelDocLink />
        </>
      }
    >
      <Button variant="plain" className="details-item__popover-button">
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

const ChannelVersionDot: React.FC<ChannelVersionDotProps> = ({ current, version }) => {
  const releaseNotesLink = getReleaseNotesLink(version);

  return releaseNotesLink ? (
    <Popover
      headerContent={<>Version {version}</>}
      bodyContent={<ReleaseNotesLink version={version} />}
    >
      <Button
        variant="secondary"
        className={classNames('co-channel-version-dot', {
          'co-channel-version-dot--current': current,
        })}
      />
    </Popover>
  ) : (
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
  const availableUpdates = getSortedUpdates(cv);
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
    <div className="co-cluster-settings__updates-graph">
      <Channel>
        <ChannelPath current>
          <ChannelLine>
            <ChannelVersion current>{lastVersion}</ChannelVersion>
            <ChannelVersionDot current channel={currentChannel} version={lastVersion} />
          </ChannelLine>
          <ChannelLine>
            {availableUpdates.length === 2 && (
              <>
                <ChannelVersion>{secondNewestVersion}</ChannelVersion>
                <ChannelVersionDot channel={currentChannel} version={secondNewestVersion} />
              </>
            )}
            {availableUpdates.length > 2 && (
              <Button
                variant="secondary"
                className="co-channel-more-versions"
                onClick={() => clusterMoreUpdatesModal({ cv })}
              >
                + More
              </Button>
            )}
          </ChannelLine>
          <ChannelLine>
            {newestVersion && (
              <>
                <ChannelVersion>{newestVersion}</ChannelVersion>
                <ChannelVersionDot channel={currentChannel} version={newestVersion} />
              </>
            )}
          </ChannelLine>
        </ChannelPath>
        <ChannelName current>{currentChannel} channel</ChannelName>
      </Channel>
      {newerChannel && (
        <Channel>
          <ChannelPath>
            <ChannelLine start>
              <div className="co-channel-switch"></div>
            </ChannelLine>
            <ChannelLine />
            <ChannelLine />
          </ChannelPath>
          <ChannelName>{newerChannel} channel</ChannelName>
        </Channel>
      )}
    </div>
  );
};

const UpdatesBar: React.FC<UpdatesBarProps> = ({ children }) => {
  return <div className="co-cluster-settings__updates-bar">{children}</div>;
};

const UpdatesGroup: React.FC<UpdatesGroupProps> = ({ children, divided }) => {
  return (
    <div
      className={classNames('co-cluster-settings__updates-group', {
        'co-cluster-settings__updates-group--divided': divided,
      })}
    >
      {children}
    </div>
  );
};

const UpdatesType: React.FC<UpdatesTypeProps> = ({ children }) => {
  return <div className="co-cluster-settings__updates-type">{children}</div>;
};

const ClusterOperatorsResource: WatchK8sResource = {
  isList: true,
  kind: referenceForModel(ClusterOperatorModel),
};

const MachineConfigPoolsResource: WatchK8sResource = {
  isList: true,
  kind: referenceForModel(MachineConfigPoolModel),
};

const UpdateProgress: React.FC<UpdateProgressProps> = ({ cv }) => {
  const [clusterOperators] = useK8sWatchResource<ClusterOperator[]>(ClusterOperatorsResource);
  const [machineConfigPools] = useK8sWatchResource<MachineConfigPoolKind[]>(
    MachineConfigPoolsResource,
  );
  const desiredVersion = getDesiredClusterVersion(cv);
  const updateStartedTime = getStartedTimeForCVDesiredVersion(cv, desiredVersion);
  const totalOperatorsCount = clusterOperators?.length || 0;
  const updatedOperatorsCount = getUpdatedOperatorsCount(clusterOperators, desiredVersion);
  const percentOperators = calculatePercentage(updatedOperatorsCount, totalOperatorsCount);
  const masterMachinePoolConfig = getMCPByName(machineConfigPools, 'master');
  const masterMachinePoolConfigUpdatingTime = getUpdatingTimeForMCP(masterMachinePoolConfig);
  const totalMasterNodes = masterMachinePoolConfig?.status?.machineCount || 0;
  const updatedMasterNodes =
    masterMachinePoolConfigUpdatingTime > updateStartedTime
      ? masterMachinePoolConfig?.status?.updatedMachineCount
      : 0;
  const percentMasterNodes = calculatePercentage(updatedMasterNodes, totalMasterNodes);
  const workerMachinePoolConfig = getMCPByName(machineConfigPools, 'worker');
  const workerMachinePoolConfigUpdatingTime = getUpdatingTimeForMCP(workerMachinePoolConfig);
  const totalWorkerNodes = workerMachinePoolConfig?.status?.machineCount || 0;
  const updatedWorkerNodes =
    workerMachinePoolConfigUpdatingTime > updateStartedTime
      ? workerMachinePoolConfig?.status?.updatedMachineCount
      : 0;
  const percentWorkerNodes = calculatePercentage(updatedWorkerNodes, totalWorkerNodes);

  return (
    <div className="co-cluster-settings__updates-progress">
      <UpdatesGroup>
        <UpdatesType>
          <Link to="/settings/cluster/clusteroperators">Cluster Operators</Link>
        </UpdatesType>
        <UpdatesBar>
          <Progress
            title={`${updatedOperatorsCount} of ${totalOperatorsCount}`}
            value={!_.isNaN(percentOperators) ? percentOperators : null}
            size={ProgressSize.sm}
            variant={percentOperators === 100 ? ProgressVariant.success : null}
          />
        </UpdatesBar>
      </UpdatesGroup>
      {masterMachinePoolConfig && (
        <UpdatesGroup>
          <UpdatesType>
            <Link to="/k8s/cluster/nodes?rowFilter-node-role=master">Master Nodes</Link>
          </UpdatesType>
          <UpdatesBar>
            <Progress
              title={`${updatedMasterNodes} of ${totalMasterNodes}`}
              value={!_.isNaN(percentMasterNodes) ? percentMasterNodes : null}
              size={ProgressSize.sm}
              variant={percentMasterNodes === 100 ? ProgressVariant.success : null}
            />
          </UpdatesBar>
        </UpdatesGroup>
      )}
      {workerMachinePoolConfig && (
        <UpdatesGroup divided>
          <UpdatesType>
            <Link to="/k8s/cluster/nodes?rowFilter-node-role=worker">Worker Nodes</Link>
            <Tooltip
              content={
                <>
                  Worker nodes will continue to update after the update of master nodes and
                  operators are complete.
                </>
              }
            >
              <BlueInfoCircleIcon className="co-icon-space-l" />
            </Tooltip>
          </UpdatesType>
          <UpdatesBar>
            <Progress
              title={`${updatedWorkerNodes} of ${totalWorkerNodes}`}
              value={!_.isNaN(percentWorkerNodes) ? percentWorkerNodes : null}
              size={ProgressSize.sm}
              variant={percentWorkerNodes === 100 ? ProgressVariant.success : null}
            />
          </UpdatesBar>
        </UpdatesGroup>
      )}
    </div>
  );
};

export const ClusterVersionDetailsTable: React.SFC<ClusterVersionDetailsTableProps> = ({
  obj: cv,
  autoscalers,
}) => {
  const { history = [] } = cv.status;
  const clusterID = getClusterID(cv);
  const desiredImage: string = _.get(cv, 'status.desired.image') || '';
  // Split image on `@` to emphasize the digest.
  const imageParts = desiredImage.split('@');
  const releaseNotes = showReleaseNotes();
  const status = getClusterUpdateStatus(cv);

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
                    <UpdateLink cv={cv} />
                  </div>
                </div>
                {(status === ClusterUpdateStatus.UpToDate ||
                  status === ClusterUpdateStatus.UpdatesAvailable) && <UpdatesGraph cv={cv} />}
                {(status === ClusterUpdateStatus.Failing ||
                  status === ClusterUpdateStatus.UpdatingAndFailing ||
                  status === ClusterUpdateStatus.Updating) && <UpdateProgress cv={cv} />}
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
        <SectionHeading text="Update History" />
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
                  {releaseNotes && <th className="hidden-xs hidden-sm">Release Notes</th>}
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
                    {releaseNotes && (
                      <td className="hidden-xs hidden-sm">
                        {getReleaseNotesLink(update.version) ? (
                          <ReleaseNotesLink version={update.version} />
                        ) : (
                          '-'
                        )}
                      </td>
                    )}
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

type ReleaseNotesLinkProps = {
  version: string;
};

type CVStatusMessageProps = {
  cv: ClusterVersionKind;
  isFailing?: boolean;
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
  channel: string;
  current?: boolean;
  version: string;
};

type UpdatesBarProps = {
  children: React.ReactNode;
};

type UpdatesGraphProps = {
  cv: ClusterVersionKind;
};

type UpdatesGroupProps = {
  children: React.ReactNode;
  divided?: boolean;
};

type UpdatesTypeProps = {
  children: React.ReactNode;
};

type UpdateProgressProps = {
  cv: ClusterVersionKind;
};

type ClusterVersionDetailsTableProps = {
  obj: ClusterVersionKind;
  autoscalers: K8sResourceKind[];
};

type ClusterVersionConditionsLinkProps = {
  cv: ClusterVersionKind;
};

type ClusterSettingsPageProps = {
  match: any;
};

type ClusterOperatorTabPageProps = {
  obj: ClusterVersionKind;
};
