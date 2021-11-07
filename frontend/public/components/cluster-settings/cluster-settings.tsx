import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import * as semver from 'semver';
import { Helmet } from 'react-helmet';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  Label,
  Popover,
  Progress,
  ProgressSize,
  ProgressVariant,
  Tooltip,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { useTranslation } from 'react-i18next';

import { AddCircleOIcon, PencilAltIcon, SyncAltIcon } from '@patternfly/react-icons';
import { removeQueryArgument } from '@console/internal/components/utils/router';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
} from '@console/operator-lifecycle-manager';

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
  NodeModel,
} from '../../models';
import {
  ClusterOperator,
  ClusterUpdateStatus,
  ClusterVersionConditionType,
  ClusterVersionKind,
  clusterVersionReference,
  getAvailableClusterUpdates,
  getClusterID,
  getClusterOperatorVersion,
  getClusterUpdateStatus,
  getClusterVersionCondition,
  getConditionUpgradeableFalse,
  getCurrentVersion,
  getDesiredClusterVersion,
  getLastCompletedUpdate,
  getNewerClusterVersionChannel,
  getNewerMinorVersionUpdate,
  getNotUpgradeableResources,
  getOCMLink,
  getReleaseNotesLink,
  getSimilarClusterVersionChannels,
  getSortedUpdates,
  isMinorVersionNewer,
  k8sPatch,
  K8sResourceConditionStatus,
  K8sResourceKind,
  MachineConfigPoolConditionType,
  MachineConfigPoolKind,
  referenceForModel,
  showReleaseNotes,
  splitClusterVersionChannel,
  UpdateHistory,
} from '../../module/k8s';
import {
  EmptyBox,
  ExternalLink,
  FieldLevelHelp,
  Firehose,
  FirehoseResource,
  HorizontalNav,
  isUpstream,
  openshiftHelpBase,
  ReleaseNotesLink,
  ResourceLink,
  resourcePathFromModel,
  SectionHeading,
  Timestamp,
  truncateMiddle,
  UpstreamConfigDetailsItem,
  useAccessReview,
} from '../utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  BlueArrowCircleUpIcon,
  BlueInfoCircleIcon,
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { useFlag } from '@console/shared/src/hooks/flag';
import { FLAGS } from '@console/shared/src/constants';

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

export const CurrentChannel: React.FC<CurrentChannelProps> = ({ cv, clusterVersionIsEditable }) => {
  const { t } = useTranslation();
  const label = cv.spec.channel || t('public~Not configured');
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

const InvalidMessage: React.FC<CVStatusMessageProps> = ({ cv }) => {
  const { t } = useTranslation();
  return (
    <>
      <div>
        <RedExclamationCircleIcon /> {t('public~Invalid cluster version')}
      </div>
      <Button onClick={() => cancelUpdate(cv)} variant="primary">
        {t('public~Cancel update')}
      </Button>
    </>
  );
};

const UpdatesAvailableMessage: React.FC<CVStatusMessageProps> = () => {
  const { t } = useTranslation();
  return (
    <div className="co-update-status">
      <BlueArrowCircleUpIcon /> {t('public~Available updates')}
    </div>
  );
};

const FailingMessageText: React.FC<CVStatusMessageProps> = ({ cv }) => {
  const failingCondition = getClusterVersionCondition(
    cv,
    ClusterVersionConditionType.Failing,
    K8sResourceConditionStatus.True,
  );
  const { t } = useTranslation();
  return (
    <div>
      <Tooltip content={truncateMiddle(failingCondition.message, { length: 256 })}>
        <span>
          <RedExclamationCircleIcon /> {t('public~Failing')}
        </span>
      </Tooltip>
    </div>
  );
};

export const ClusterVersionConditionsLink: React.FC<ClusterVersionConditionsLinkProps> = ({
  cv,
}) => {
  const { t } = useTranslation();
  return (
    <HashLink
      smooth
      to={`${resourcePathFromModel(ClusterVersionModel, cv.metadata.name)}#conditions`}
    >
      {t('public~View conditions')}
    </HashLink>
  );
};

export const UpdatingMessageText: React.FC<CVStatusMessageProps> = ({ cv }) => {
  const version = getDesiredClusterVersion(cv);
  const { t } = useTranslation();
  return <>{t('public~Update to {{version}} in progress', { version })}</>;
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

const ErrorRetrievingMessage: React.FC<CVStatusMessageProps> = ({ cv }) => {
  const retrievedUpdatesCondition = getClusterVersionCondition(
    cv,
    ClusterVersionConditionType.RetrievedUpdates,
    K8sResourceConditionStatus.False,
  );
  const { t } = useTranslation();
  return retrievedUpdatesCondition.reason === 'NoChannel' ? (
    <>
      <BlueInfoCircleIcon /> {t('public~Not configured to request update recommedations.')}
    </>
  ) : (
    <Tooltip content={truncateMiddle(retrievedUpdatesCondition.message, { length: 256 })}>
      <span>
        <RedExclamationCircleIcon />{' '}
        {retrievedUpdatesCondition.reason === 'VersionNotFound'
          ? t('public~Version not found')
          : t('public~Error retrieving')}
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

const UpToDateMessage: React.FC<{}> = () => {
  const { t } = useTranslation();
  return (
    <span>
      <GreenCheckCircleIcon /> {t('public~Up to date')}
    </span>
  );
};

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

export const CurrentVersion: React.FC<CurrentVersionProps> = ({ cv }) => {
  const desiredVersion = getDesiredClusterVersion(cv);
  const lastVersion = getLastCompletedUpdate(cv);
  const status = getClusterUpdateStatus(cv);
  const { t } = useTranslation();

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
        &nbsp;{t('public~Unknown')}
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
    <>{t('public~None')}</>
  );
};

export const UpdateLink: React.FC<CurrentVersionProps> = ({ cv, clusterVersionIsEditable }) => {
  const status = getClusterUpdateStatus(cv);
  const updatesAvailable = !_.isEmpty(getAvailableClusterUpdates(cv));
  const { t } = useTranslation();
  return updatesAvailable &&
    (status === ClusterUpdateStatus.ErrorRetrieving ||
      status === ClusterUpdateStatus.Failing ||
      status === ClusterUpdateStatus.UpdatesAvailable ||
      status === ClusterUpdateStatus.Updating) &&
    clusterVersionIsEditable ? (
    <div className="co-cluster-settings__details">
      <Button
        variant="primary"
        type="button"
        onClick={() => clusterUpdateModal({ cv })}
        data-test-id="cv-update-button"
      >
        {t('public~Update')}
      </Button>
    </div>
  ) : null;
};

export const CurrentVersionHeader: React.FC<CurrentVersionProps> = ({ cv }) => {
  const status = getClusterUpdateStatus(cv);
  const { t } = useTranslation();
  return (
    <>
      {status === ClusterUpdateStatus.UpToDate || status === ClusterUpdateStatus.UpdatesAvailable
        ? t('public~Current version')
        : t('public~Last completed version')}
    </>
  );
};

export const ChannelDocLink: React.FC<{}> = () => {
  const upgradeLink = isUpstream()
    ? `${openshiftHelpBase}updating/updating-cluster-between-minor.html#understanding-upgrade-channels_updating-cluster-between-minor`
    : `${openshiftHelpBase}html/updating_clusters/updating-cluster-between-minor#understanding-upgrade-channels_updating-cluster-between-minor`;
  const { t } = useTranslation();
  return (
    <ExternalLink
      href={upgradeLink}
      text={t('public~Learn more about OpenShift update channels')}
    />
  );
};

const ChannelHeader: React.FC<{}> = () => {
  const { t } = useTranslation();
  return (
    <>
      {t('public~Channel')}
      <FieldLevelHelp>
        <p>
          {t(
            'public~Channels help to control the pace of updates and recommend the appropriate release versions. Update channels are tied to a minor version of OpenShift Container Platform, for example 4.5.',
          )}
        </p>
        <ChannelDocLink />
      </FieldLevelHelp>
    </>
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

export const ChannelName: React.FC<ChannelNameProps> = ({ children, current }) => {
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

export const ChannelVersion: React.FC<ChannelVersionProps> = ({
  children,
  current,
  updateBlocked,
}) => {
  return (
    <span
      className={classNames('co-channel-version', {
        'co-channel-version--current': current,
        'co-channel-version--update-blocked': updateBlocked,
      })}
    >
      {updateBlocked && (
        <YellowExclamationTriangleIcon className="co-channel-version__warning-icon co-icon-space-r" />
      )}
      {children}
    </span>
  );
};

export const UpdateBlockedLabel = () => {
  const { t } = useTranslation();

  return (
    <Label color="orange" icon={<YellowExclamationTriangleIcon />} className="pf-u-ml-sm">
      {t('public~Update blocked')}
    </Label>
  );
};

const ChannelVersionDot: React.FC<ChannelVersionDotProps> = ({
  current,
  updateBlocked,
  version,
}) => {
  const releaseNotesLink = getReleaseNotesLink(version);
  const { t } = useTranslation();

  return releaseNotesLink || updateBlocked ? (
    <Popover
      headerContent={
        <>
          {t('public~Version')} {version}
          {updateBlocked && <UpdateBlockedLabel />}
        </>
      }
      bodyContent={
        <>
          {updateBlocked && (
            <p>
              {t(
                'public~See the alert above the visualization for instructions on how to unblock this version.',
              )}
            </p>
          )}
          {releaseNotesLink && <ReleaseNotesLink version={version} />}
        </>
      }
    >
      <Button
        variant="secondary"
        className={classNames('co-channel-version-dot', {
          'co-channel-version-dot--current': current,
          'co-channel-version-dot--update-blocked': updateBlocked,
        })}
      />
    </Popover>
  ) : (
    <div
      className={classNames('co-channel-version-dot', {
        'co-channel-version-dot--current': current,
        'co-channel-version-dot--update-blocked': updateBlocked,
      })}
    ></div>
  );
};

const UpdatesBar: React.FC<UpdatesBarProps> = ({ children }) => {
  return <div className="co-cluster-settings__updates-bar">{children}</div>;
};

export const UpdatesGroup: React.FC<UpdatesGroupProps> = ({ children, divided }) => {
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

export const UpdatesProgress: React.FC<UpdatesProgressProps> = ({ children }) => {
  return <div className="co-cluster-settings__updates-progress">{children}</div>;
};

const UpdatesType: React.FC<UpdatesTypeProps> = ({ children }) => {
  return <div className="co-cluster-settings__updates-type">{children}</div>;
};

export const NodesUpdatesGroup: React.FC<NodesUpdatesGroupProps> = ({
  divided,
  hideIfComplete,
  machineConfigPool,
  name,
  updateStartedTime,
}) => {
  const MCPUpdatingTime = getUpdatingTimeForMCP(machineConfigPool);
  const totalMCPNodes = machineConfigPool?.status?.machineCount || 0;
  const updatedMCPNodes =
    MCPUpdatingTime > updateStartedTime ? machineConfigPool?.status?.updatedMachineCount : 0;
  const percentMCPNodes = calculatePercentage(updatedMCPNodes, totalMCPNodes);
  const { t } = useTranslation();
  return hideIfComplete && percentMCPNodes === 100 ? null : (
    <UpdatesGroup divided={divided}>
      <UpdatesType>
        <Link to={`/k8s/cluster/nodes?rowFilter-node-role=${machineConfigPool.metadata.name}`}>
          {t('public~{{name}} Nodes', { name })}
        </Link>
        {name !== 'Master' && (
          <FieldLevelHelp>
            {t(
              'public~{{name}} {{resource}} may continue to update after the update of Master {{resource}} and {{resource2}} are complete.',
              {
                name,
                resource: NodeModel.labelPlural,
                resource2: ClusterOperatorModel.labelPlural,
              },
            )}
          </FieldLevelHelp>
        )}
      </UpdatesType>
      <UpdatesBar>
        <Progress
          title={t('public~{{updatedMCPNodes}} of {{totalMCPNodes}}', {
            updatedMCPNodes,
            totalMCPNodes,
          })}
          value={!_.isNaN(percentMCPNodes) ? percentMCPNodes : null}
          size={ProgressSize.sm}
          variant={percentMCPNodes === 100 ? ProgressVariant.success : null}
        />
      </UpdatesBar>
    </UpdatesGroup>
  );
};

const OtherNodes: React.FC<OtherNodesProps> = ({
  hideIfComplete,
  machineConfigPools,
  updateStartedTime,
}) => {
  const otherNodes = machineConfigPools
    .filter((mcp) => mcp.metadata.name !== 'master' && mcp.metadata.name !== 'worker')
    .sort((a, b) => a.metadata.creationTimestamp.localeCompare(b.metadata.creationTimestamp));
  return (
    <>
      {otherNodes.map((mcp) => {
        return (
          <NodesUpdatesGroup
            divided
            hideIfComplete={hideIfComplete}
            key={mcp.metadata.uid}
            name={mcp.metadata.name}
            machineConfigPool={mcp}
            updateStartedTime={updateStartedTime}
          />
        );
      })}
    </>
  );
};

export const UpdatesGraph: React.FC<UpdatesGraphProps> = ({ cv }) => {
  const availableUpdates = getSortedUpdates(cv);
  const lastVersion = getLastCompletedUpdate(cv);
  const newestVersion = availableUpdates[0]?.version;
  const secondNewestVersion = availableUpdates[1]?.version;
  const currentChannel = cv.spec.channel;
  const currentPrefix = splitClusterVersionChannel(currentChannel)?.prefix;
  const similarChannels = getSimilarClusterVersionChannels(cv, currentPrefix);
  const newerChannel = getNewerClusterVersionChannel(similarChannels, currentChannel);
  const clusterUpgradeableFalse = !!getConditionUpgradeableFalse(cv);
  const { t } = useTranslation();

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
                {t('public~+ More')}
              </Button>
            )}
          </ChannelLine>
          <ChannelLine>
            {newestVersion && (
              <>
                <ChannelVersion
                  updateBlocked={
                    clusterUpgradeableFalse && isMinorVersionNewer(lastVersion, newestVersion)
                  }
                >
                  {newestVersion}
                </ChannelVersion>
                <ChannelVersionDot
                  channel={currentChannel}
                  updateBlocked={
                    clusterUpgradeableFalse && isMinorVersionNewer(lastVersion, newestVersion)
                  }
                  version={newestVersion}
                />
              </>
            )}
          </ChannelLine>
        </ChannelPath>
        <ChannelName current>
          {t('public~{{currentChannel}} channel', { currentChannel })}
        </ChannelName>
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
          <ChannelName>{t('public~{{newerChannel}} channel', { newerChannel })}</ChannelName>
        </Channel>
      )}
    </div>
  );
};

const ClusterOperatorsResource: WatchK8sResource = {
  isList: true,
  kind: referenceForModel(ClusterOperatorModel),
};

const MachineConfigPoolsResource: WatchK8sResource = {
  isList: true,
  kind: referenceForModel(MachineConfigPoolModel),
};

export const ClusterOperatorsLink: React.FC<ClusterOperatorsLinkProps> = ({
  children,
  queryString,
}) => <Link to={`/settings/cluster/clusteroperators${queryString}`}>{children}</Link>;

export const UpdateInProgress: React.FC<UpdateInProgressProps> = ({
  desiredVersion,
  machineConfigPools,
  workerMachineConfigPool,
  updateStartedTime,
}) => {
  const [clusterOperators] = useK8sWatchResource<ClusterOperator[]>(ClusterOperatorsResource);
  const totalOperatorsCount = clusterOperators?.length || 0;
  const updatedOperatorsCount = getUpdatedOperatorsCount(clusterOperators, desiredVersion);
  const percentOperators = calculatePercentage(updatedOperatorsCount, totalOperatorsCount);
  const masterMachinePoolConfig = getMCPByName(machineConfigPools, 'master');
  const { t } = useTranslation();

  return (
    <UpdatesProgress>
      <UpdatesGroup>
        <UpdatesType>
          <ClusterOperatorsLink>{t(ClusterOperatorModel.labelPluralKey)}</ClusterOperatorsLink>
        </UpdatesType>
        <UpdatesBar>
          <Progress
            title={t('public~{{updatedOperatorsCount}} of {{totalOperatorsCount}}', {
              updatedOperatorsCount,
              totalOperatorsCount,
            })}
            value={!_.isNaN(percentOperators) ? percentOperators : null}
            size={ProgressSize.sm}
            variant={percentOperators === 100 ? ProgressVariant.success : null}
          />
        </UpdatesBar>
      </UpdatesGroup>
      {masterMachinePoolConfig && (
        <NodesUpdatesGroup
          machineConfigPool={masterMachinePoolConfig}
          name="Master"
          updateStartedTime={updateStartedTime}
        />
      )}
      {workerMachineConfigPool && (
        <NodesUpdatesGroup
          divided
          machineConfigPool={workerMachineConfigPool}
          name="Worker"
          updateStartedTime={updateStartedTime}
        />
      )}
      {machineConfigPools.length > 2 && (
        <OtherNodes machineConfigPools={machineConfigPools} updateStartedTime={updateStartedTime} />
      )}
    </UpdatesProgress>
  );
};

const ClusterServiceVersionResource: WatchK8sResource = {
  isList: true,
  kind: referenceForModel(ClusterServiceVersionModel),
};

export const ClusterNotUpgradeableAlert: React.FC<ClusterNotUpgradeableAlertProps> = ({ cv }) => {
  const [clusterOperators] = useK8sWatchResource<ClusterOperator[]>(ClusterOperatorsResource);
  const [clusterServiceVersions] = useK8sWatchResource<ClusterServiceVersionKind[]>(
    ClusterServiceVersionResource,
  );
  const { t } = useTranslation();
  const notUpgradeableClusterOperators = getNotUpgradeableResources(clusterOperators);
  const notUpgradeableClusterOperatorsPresent = notUpgradeableClusterOperators.length > 0;
  const notUpgradeableClusterServiceVersions = getNotUpgradeableResources(clusterServiceVersions);
  const notUpgradeableCSVsPresent = notUpgradeableClusterServiceVersions.length > 0;
  const clusterUpgradeableFalseCondition = getConditionUpgradeableFalse(cv);
  const currentVersion = getLastCompletedUpdate(cv);
  const currentVersionParsed = semver.parse(currentVersion);
  const currentMajorMinorVersion = `${currentVersionParsed?.major}.${currentVersionParsed?.minor}`;
  const availableUpdates = getSortedUpdates(cv);
  const newerUpdate = getNewerMinorVersionUpdate(currentVersion, availableUpdates);
  const newerUpdateParsed = semver.parse(newerUpdate?.version);
  const nextMajorMinorVersion = `${newerUpdateParsed?.major}.${newerUpdateParsed?.minor}`;

  return (
    <Alert
      variant="warning"
      isInline
      title={
        currentVersionParsed && newerUpdateParsed
          ? t(
              'public~This cluster should not be updated to {{nextMajorMinorVersion}}. You can continue to update to patch releases in {{currentMajorMinorVersion}}.',
              { nextMajorMinorVersion, currentMajorMinorVersion },
            )
          : t('public~This cluster should not be updated to the next minor version.')
      }
      className="co-alert"
      actionLinks={
        (notUpgradeableClusterOperatorsPresent || notUpgradeableCSVsPresent) && (
          <Flex>
            {notUpgradeableClusterOperatorsPresent && (
              <FlexItem>
                <ClusterOperatorsLink queryString="?rowFilter-cluster-operator-status=Cannot+update">
                  {t('public~View ClusterOperators')}
                </ClusterOperatorsLink>
              </FlexItem>
            )}
            {notUpgradeableCSVsPresent && (
              // TODO:  update link to include filter once installed Operators filters are updated
              <FlexItem>
                <Link to={`/k8s/ns/all-namespaces/${ClusterServiceVersionModel.plural}`}>
                  {t('public~View installed Operators')}
                </Link>
              </FlexItem>
            )}
          </Flex>
        )
      }
    >
      <SyncMarkdownView content={clusterUpgradeableFalseCondition.message} inline />
    </Alert>
  );
};

export const ClusterVersionDetailsTable: React.FC<ClusterVersionDetailsTableProps> = ({
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
  const clusterVersionIsEditable =
    useAccessReview({
      group: ClusterVersionModel.apiGroup,
      resource: ClusterVersionModel.plural,
      verb: 'patch',
      name: cv.metadata.name,
    }) && window.SERVER_FLAGS.branding !== 'dedicated';
  const [machineConfigPools] = useK8sWatchResource<MachineConfigPoolKind[]>(
    MachineConfigPoolsResource,
  );
  const desiredVersion = getDesiredClusterVersion(cv);
  const updateStartedTime = getStartedTimeForCVDesiredVersion(cv, desiredVersion);
  const workerMachineConfigPool = getMCPByName(machineConfigPools, 'worker');
  if (new URLSearchParams(window.location.search).has('showVersions')) {
    clusterUpdateModal({ cv })
      .then(() => removeQueryArgument('showVersions'))
      .catch(_.noop);
  } else if (new URLSearchParams(window.location.search).has('showChannels')) {
    clusterChannelModal({ cv })
      .then(() => removeQueryArgument('showChannels'))
      .catch(_.noop);
  }
  const { t } = useTranslation();

  return (
    <>
      <div className="co-m-pane__body">
        <div className="co-m-pane__body-group">
          {!cv.spec.channel && (
            <Alert
              variant="info"
              isInline
              title={t(
                'public~This cluster is not currently requesting update notifications. To request update recommendations, configure a channel.',
              )}
              className="co-alert"
            />
          )}
          {cv.spec.channel && status === ClusterUpdateStatus.ErrorRetrieving && (
            <Alert
              variant="danger"
              isInline
              title={t(
                'public~Version {{version}} not found in channel {{channel}}. To request update recommendations, configure a channel that supports your version.',
                { version: getLastCompletedUpdate(cv), channel: cv.spec.channel },
              )}
              className="co-alert"
            />
          )}
          {!!getConditionUpgradeableFalse(cv) && <ClusterNotUpgradeableAlert cv={cv} />}
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
                    <dt>{t('public~Update status')}</dt>
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
                        <CurrentChannel
                          cv={cv}
                          clusterVersionIsEditable={clusterVersionIsEditable}
                        />
                      </dd>
                    </dl>
                    <UpdateLink cv={cv} clusterVersionIsEditable={clusterVersionIsEditable} />
                  </div>
                </div>
                {(status === ClusterUpdateStatus.UpToDate ||
                  status === ClusterUpdateStatus.UpdatesAvailable) && (
                  <>
                    <UpdatesGraph cv={cv} />
                    {workerMachineConfigPool && (
                      <UpdatesProgress>
                        <NodesUpdatesGroup
                          divided
                          hideIfComplete
                          machineConfigPool={workerMachineConfigPool}
                          name="Worker"
                          updateStartedTime={updateStartedTime}
                        />
                        {machineConfigPools.length > 2 && (
                          <OtherNodes
                            hideIfComplete
                            machineConfigPools={machineConfigPools}
                            updateStartedTime={updateStartedTime}
                          />
                        )}
                      </UpdatesProgress>
                    )}
                  </>
                )}
                {(status === ClusterUpdateStatus.Failing ||
                  status === ClusterUpdateStatus.UpdatingAndFailing ||
                  status === ClusterUpdateStatus.Updating) && (
                  <UpdateInProgress
                    desiredVersion={desiredVersion}
                    machineConfigPools={machineConfigPools}
                    updateStartedTime={updateStartedTime}
                    workerMachineConfigPool={workerMachineConfigPool}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="co-m-pane__body-group">
          <dl className="co-m-pane__details">
            {window.SERVER_FLAGS.branding !== 'okd' && window.SERVER_FLAGS.branding !== 'azure' && (
              <>
                <dt>{t('public~Subscription')}</dt>
                <dd>
                  <ExternalLink
                    text={t('public~OpenShift Cluster Manager')}
                    href={getOCMLink(clusterID)}
                  />
                  .
                </dd>
              </>
            )}
            <dt>{t('public~Cluster ID')}</dt>
            <dd className="co-break-all co-select-to-copy" data-test-id="cv-details-table-cid">
              {clusterID}
            </dd>
            <dt>{t('public~Desired release image')}</dt>
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
            <dt>{t('public~Cluster version configuration')}</dt>
            <dd>
              <ResourceLink kind={referenceForModel(ClusterVersionModel)} name={cv.metadata.name} />
            </dd>
            <UpstreamConfigDetailsItem resource={cv} />
            {autoscalers && (
              <>
                <dt>{t('public~Cluster autoscaler')}</dt>
                <dd>
                  {_.isEmpty(autoscalers) ? (
                    <Link to={`${resourcePathFromModel(ClusterAutoscalerModel)}/~new`}>
                      <AddCircleOIcon className="co-icon-space-r" />
                      {t('public~Create autoscaler')}
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
              </>
            )}
          </dl>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Update history')} />
        {_.isEmpty(history) ? (
          <EmptyBox label={t('public~History')} />
        ) : (
          <div className="co-table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('public~Version')}</th>
                  <th>{t('public~State')}</th>
                  <th>{t('public~Started')}</th>
                  <th>{t('public~Completed')}</th>
                  {releaseNotes && (
                    <th className="hidden-xs hidden-sm">{t('public~Release notes')}</th>
                  )}
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

export const ClusterOperatorTabPage: React.FC<ClusterOperatorTabPageProps> = ({ obj: cv }) => (
  <ClusterOperatorPage cv={cv} autoFocus={false} showTitle={false} />
);

export const ClusterSettingsPage: React.FC<ClusterSettingsPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const hasClusterAutoscaler = useFlag(FLAGS.CLUSTER_AUTOSCALER);
  const title = t('public~Cluster Settings');
  const resources: FirehoseResource[] = [
    { kind: clusterVersionReference, name: 'version', isList: false, prop: 'obj' },
  ];
  if (hasClusterAutoscaler) {
    resources.push({
      kind: clusterAutoscalerReference,
      isList: true,
      prop: 'autoscalers',
      optional: true,
    });
  }
  const resourceKeys = _.map(resources, 'prop');
  const pages = [
    {
      href: '',
      name: t('public~Details'),
      component: ClusterVersionDetailsTable,
    },
    {
      href: 'clusteroperators',
      name: t(ClusterOperatorModel.labelPluralKey),
      component: ClusterOperatorTabPage,
    },
    {
      href: 'globalconfig',
      name: t('public~Configuration'),
      component: GlobalConfigPage,
    },
  ];
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
  isFailing?: boolean;
};

type CurrentChannelProps = {
  cv: K8sResourceKind;
  clusterVersionIsEditable: boolean;
};

type CurrentVersionProps = {
  cv: ClusterVersionKind;
  clusterVersionIsEditable?: boolean;
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
  updateBlocked?: boolean;
};

type ChannelVersionDotProps = {
  channel: string;
  current?: boolean;
  updateBlocked?: boolean;
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

type UpdatesProgressProps = {
  children: React.ReactNode;
};

type UpdatesTypeProps = {
  children: React.ReactNode;
};

type NodesUpdatesGroupProps = {
  divided?: boolean;
  hideIfComplete?: boolean;
  name: string;
  machineConfigPool: MachineConfigPoolKind;
  updateStartedTime: string;
};

type OtherNodesProps = {
  hideIfComplete?: boolean;
  machineConfigPools: MachineConfigPoolKind[];
  updateStartedTime: string;
};

type ClusterOperatorsLinkProps = {
  children: React.ReactNode;
  queryString?: string;
};

type UpdateInProgressProps = {
  desiredVersion: string;
  machineConfigPools: MachineConfigPoolKind[];
  workerMachineConfigPool: MachineConfigPoolKind;
  updateStartedTime: string;
};

type ClusterNotUpgradeableAlertProps = {
  cv: ClusterVersionKind;
};

type ClusterVersionDetailsTableProps = {
  obj: ClusterVersionKind;
  autoscalers?: K8sResourceKind[];
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
