/* eslint-disable @typescript-eslint/no-use-before-define */
import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import * as semver from 'semver';
import {
  Alert,
  AlertActionLink,
  Button,
  Flex,
  FlexItem,
  Label,
  Popover,
  Progress,
  ProgressSize,
  ProgressVariant,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom-v5-compat';
import { HashLink } from 'react-router-hash-link';
import { useTranslation } from 'react-i18next';

import { AddCircleOIcon } from '@patternfly/react-icons/dist/esm/icons/add-circle-o-icon';
import { PauseCircleIcon } from '@patternfly/react-icons/dist/esm/icons/pause-circle-icon';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';

import { removeQueryArgument } from '@console/internal/components/utils/router';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
} from '@console/operator-lifecycle-manager';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk';

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
  MachineConfigModel,
  NodeModel,
} from '../../models';
import {
  clusterIsUpToDateOrUpdateAvailable,
  ClusterOperator,
  ClusterUpdateStatus,
  ClusterVersionConditionType,
  ClusterVersionKind,
  clusterVersionReference,
  getClusterID,
  getClusterOperatorVersion,
  getClusterUpdateStatus,
  getClusterVersionCondition,
  getConditionUpgradeableFalse,
  getCurrentVersion,
  getDesiredClusterVersion,
  getLastCompletedUpdate,
  getMCPsToPausePromises,
  getNewerClusterVersionChannel,
  getNewerMinorVersionUpdate,
  getNotUpgradeableResources,
  getOCMLink,
  getReleaseNotesLink,
  getSimilarClusterVersionChannels,
  getSortedAvailableUpdates,
  isMCPMaster,
  isMCPPaused,
  isMCPWorker,
  isMinorVersionNewer,
  k8sPatch,
  K8sResourceConditionStatus,
  K8sResourceKind,
  MachineConfigPoolConditionType,
  MachineConfigPoolKind,
  NodeTypeNames,
  NodeTypes,
  referenceForModel,
  showReleaseNotes,
  sortMCPsByCreationTimestamp,
  splitClusterVersionChannel,
  UpdateHistory,
} from '../../module/k8s';
import {
  documentationURLs,
  EmptyBox,
  ExternalLink,
  FieldLevelHelp,
  Firehose,
  FirehoseResource,
  getDocumentationURL,
  HorizontalNav,
  isManaged,
  PageHeading,
  ReleaseNotesLink,
  ResourceLink,
  resourcePathFromModel,
  SectionHeading,
  Timestamp,
  togglePaused,
  truncateMiddle,
  UpstreamConfigDetailsItem,
  useAccessReview,
} from '../utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  BlueArrowCircleUpIcon,
  BlueInfoCircleIcon,
  GreenCheckCircleIcon,
  isClusterExternallyManaged,
  RedExclamationCircleIcon,
  useCanClusterUpgrade,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import { PageTitleContext } from '@console/shared/src/components/pagetitle/PageTitleContext';
import { useFlag } from '@console/shared/src/hooks/flag';
import { FLAGS } from '@console/shared/src/constants';

import {
  ServiceLevel,
  useServiceLevelTitle,
  ServiceLevelText,
  ServiceLevelLoading,
} from '../utils/service-level';
import { hasAvailableUpdates, hasNotRecommendedUpdates } from '../../module/k8s/cluster-settings';

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

const getReleaseImageVersion = (obj: K8sResourceKind): string => {
  return obj?.metadata?.annotations?.['machineconfiguration.openshift.io/release-image-version'];
};

const calculatePercentage = (numerator: number, denominator: number): number =>
  Math.round((numerator / denominator) * 100);

export const CurrentChannel: React.FC<CurrentChannelProps> = ({ cv, canUpgrade }) => {
  const { t } = useTranslation();
  const label = cv.spec.channel || t('public~Not configured');
  return canUpgrade ? (
    <Button
      type="button"
      isInline
      data-test-id="current-channel-update-link"
      onClick={() => clusterChannelModal({ cv })}
      variant="link"
    >
      {label}
      <PencilAltIcon className="co-icon-space-l pf-v5-c-button-icon--plain" />
    </Button>
  ) : (
    <>{label}</>
  );
};

const StatusMessagePopover: React.FC<CVStatusMessagePopoverProps> = ({ bodyContent, children }) => {
  return (
    <Popover bodyContent={truncateMiddle(bodyContent, { length: 256 })}>
      <Button variant="link" isInline>
        <span>{children}</span>
      </Button>
    </Popover>
  );
};

const InvalidMessage: React.FC<CVStatusMessageProps> = ({ cv }) => {
  const { t } = useTranslation();
  return (
    <div data-test="cv-update-status-invalid">
      <div>
        <RedExclamationCircleIcon /> {t('public~Invalid cluster version')}
      </div>
      <Button onClick={() => cancelUpdate(cv)} variant="primary" className="pf-v5-u-mt-xs">
        {t('public~Cancel update')}
      </Button>
    </div>
  );
};

const ReleaseNotAcceptedMessage: React.FC<CVStatusMessageProps> = ({ cv }) => {
  const releaseNotAcceptedCondition = getClusterVersionCondition(
    cv,
    ClusterVersionConditionType.ReleaseAccepted,
    K8sResourceConditionStatus.False,
  );
  const { t } = useTranslation();
  return (
    <>
      <div data-test="cv-update-status-release-accepted-false">
        <StatusMessagePopover bodyContent={releaseNotAcceptedCondition.message}>
          <RedExclamationCircleIcon /> {t('public~Release not accepted')}
        </StatusMessagePopover>
      </div>
      <ClusterVersionConditionsLink cv={cv} />
    </>
  );
};

const UpdatesAvailableMessage: React.FC<CVStatusMessageProps> = () => {
  const { t } = useTranslation();
  return (
    <div className="co-update-status" data-test="cv-update-status-available-updates">
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
    <div data-test="cv-update-status-failing">
      <StatusMessagePopover bodyContent={failingCondition.message}>
        <RedExclamationCircleIcon /> {t('public~Failing')}
      </StatusMessagePopover>
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
      <div data-test="cv-update-status-updating">
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
    <div data-test="cv-update-status-no-channel">
      <BlueInfoCircleIcon /> {retrievedUpdatesCondition.message}
    </div>
  ) : (
    <>
      <div data-test="cv-update-status-no-updates">
        <StatusMessagePopover bodyContent={retrievedUpdatesCondition.message}>
          <RedExclamationCircleIcon /> {t('public~Not retrieving updates')}
        </StatusMessagePopover>
      </div>
      <ClusterVersionConditionsLink cv={cv} />
    </>
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

export const UpToDateMessage: React.FC<{}> = () => {
  const { t } = useTranslation();
  return (
    <span data-test="cv-update-status-up-to-date">
      <GreenCheckCircleIcon /> {t('public~Up to date')}
    </span>
  );
};

export const UpdateStatus: React.FC<UpdateStatusProps> = ({ cv }) => {
  const status = getClusterUpdateStatus(cv);
  switch (status) {
    case ClusterUpdateStatus.Invalid:
      return <InvalidMessage cv={cv} />;
    case ClusterUpdateStatus.ReleaseNotAccepted:
      return <ReleaseNotAcceptedMessage cv={cv} />;
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

  if (clusterIsUpToDateOrUpdateAvailable(status)) {
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

export const UpdateLink: React.FC<CurrentVersionProps> = ({ cv, canUpgrade }) => {
  // assume if 'worker' is editable, others are too
  const workerMachineConfigPoolIsEditable = useAccessReview({
    group: MachineConfigPoolModel.apiGroup,
    resource: MachineConfigPoolModel.plural,
    verb: 'patch',
    name: NodeTypes.worker,
  });
  const status = getClusterUpdateStatus(cv);
  const { t } = useTranslation();
  const hasNotRecommended = hasNotRecommendedUpdates(cv);
  return canUpgrade &&
    (hasAvailableUpdates(cv) || hasNotRecommended) &&
    (status === ClusterUpdateStatus.ErrorRetrieving ||
      status === ClusterUpdateStatus.Failing ||
      status === ClusterUpdateStatus.UpdatesAvailable ||
      status === ClusterUpdateStatus.Updating ||
      (status === ClusterUpdateStatus.UpToDate && hasNotRecommended)) &&
    workerMachineConfigPoolIsEditable ? (
    <div className="co-cluster-settings__details">
      <Button
        variant="primary"
        type="button"
        onClick={() => clusterUpdateModal({ cv })}
        data-test-id="cv-update-button"
      >
        {t('public~Select a version')}
      </Button>
    </div>
  ) : null;
};

export const CurrentVersionHeader: React.FC<CurrentVersionProps> = ({ cv }) => {
  const status = getClusterUpdateStatus(cv);
  const { t } = useTranslation();
  return (
    <>
      {clusterIsUpToDateOrUpdateAvailable(status)
        ? t('public~Current version')
        : t('public~Last completed version')}
    </>
  );
};

export const ChannelDocLink: React.FC<{}> = () => {
  const upgradeURL = getDocumentationURL(documentationURLs.understandingUpgradeChannels);
  const { t } = useTranslation();
  return (
    <ExternalLink href={upgradeURL} text={t('public~Learn more about OpenShift update channels')} />
  );
};

const ChannelHeader: React.FC<{}> = () => {
  const { t } = useTranslation();
  return (
    <>
      {t('public~Channel')}
      <FieldLevelHelp>
        <TextContent>
          <Text component={TextVariants.p}>
            {t(
              'public~Channels help to control the pace of updates and recommend the appropriate release versions. Update channels are tied to a minor version of OpenShift Container Platform, for example 4.5.',
            )}
          </Text>
          {!isManaged() && (
            <Text component={TextVariants.p}>
              <ChannelDocLink />
            </Text>
          )}
        </TextContent>
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
      data-test="cv-channel"
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
      data-test="cv-channel-name"
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
  const test = 'cv-channel-version';
  return (
    <span
      className={classNames('co-channel-version', {
        'co-channel-version--current': current,
        'co-channel-version--update-blocked': updateBlocked,
      })}
      data-test={updateBlocked ? `${test}-blocked` : test}
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
    <Label
      color="orange"
      icon={<YellowExclamationTriangleIcon />}
      className="pf-v5-u-ml-sm"
      data-test="cv-update-blocked"
    >
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
  const test = 'cv-channel-version-dot';

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
            <p data-test="cv-channel-version-dot-blocked-info">
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
        data-test={updateBlocked ? `${test}-blocked` : test}
      />
    </Popover>
  ) : (
    <div
      className={classNames('co-channel-version-dot', {
        'co-channel-version-dot--current': current,
        'co-channel-version-dot--update-blocked': updateBlocked,
      })}
      data-test={test}
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
      data-test="cv-updates-group"
    >
      {children}
    </div>
  );
};

export const UpdatesProgress: React.FC<UpdatesProgressProps> = ({ children }) => {
  return (
    <div className="co-cluster-settings__updates-progress" data-test="cv-updates-progress">
      {children}
    </div>
  );
};

const UpdatesType: React.FC<UpdatesTypeProps> = ({ children }) => {
  return <div className="co-cluster-settings__updates-type">{children}</div>;
};

export const NodesUpdatesGroup: React.FC<NodesUpdatesGroupProps> = ({
  divided,
  desiredVersion,
  hideIfComplete,
  machineConfigPool,
  name,
  updateStartedTime,
}) => {
  const [machineConfigOperator, machineConfigOperatorLoaded] = useK8sWatchResource<ClusterOperator>(
    {
      kind: referenceForModel(ClusterOperatorModel),
      name: 'machine-config',
    },
  );
  const [renderedConfig, renderedConfigLoaded] = useK8sWatchResource<K8sResourceKind>({
    kind: referenceForModel(MachineConfigModel),
    name: machineConfigPool?.spec?.configuration?.name,
  });
  const mcpName = machineConfigPool?.metadata?.name;
  const machineConfigPoolIsEditable = useAccessReview({
    group: MachineConfigPoolModel.apiGroup,
    resource: MachineConfigPoolModel.plural,
    verb: 'patch',
    name: mcpName,
  });
  const isMaster = isMCPMaster(machineConfigPool);
  const isPaused = isMCPPaused(machineConfigPool);
  const renderedConfigIsUpdated = getReleaseImageVersion(renderedConfig) === desiredVersion;
  const MCOIsUpdated = getClusterOperatorVersion(machineConfigOperator) === desiredVersion;
  const MCPisUpdated = machineConfigPool?.status?.conditions?.some(
    (c) => c.type === 'Updated' && c.status === K8sResourceConditionStatus.True,
  );
  const updatedMachineCountReady = MCOIsUpdated && MCPisUpdated;
  const MCPUpdatingTime = getUpdatingTimeForMCP(machineConfigPool);
  const totalMCPNodes = machineConfigPool?.status?.machineCount || 0;
  const updatedMCPNodes =
    updatedMachineCountReady || (MCPUpdatingTime > updateStartedTime && renderedConfigIsUpdated)
      ? machineConfigPool?.status?.updatedMachineCount
      : 0;
  const percentMCPNodes = calculatePercentage(updatedMCPNodes, totalMCPNodes);
  const isUpdated = percentMCPNodes === 100;
  const nodeRoleFilterValue = isMaster ? 'control-plane' : mcpName;
  const { t } = useTranslation();
  return totalMCPNodes === 0 || (hideIfComplete && isUpdated)
    ? null
    : machineConfigOperatorLoaded && renderedConfigLoaded && (
        <UpdatesGroup divided={divided}>
          <UpdatesType>
            <Link to={`/k8s/cluster/nodes?rowFilter-node-role=${nodeRoleFilterValue}`}>
              {`${name} ${NodeModel.labelPlural}`}
            </Link>
            {!isMaster && (
              <FieldLevelHelp>
                {t(
                  'public~{{name}} {{resource}} may continue to update after the update of {{master}} {{resource}} and {{resource2}} are complete.',
                  {
                    name,
                    resource: NodeModel.labelPlural,
                    master: NodeTypeNames.Master,
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
          {!isMaster && !isUpdated && machineConfigPoolIsEditable && (
            <Button
              variant="secondary"
              className="pf-v5-u-mt-md"
              onClick={() =>
                togglePaused(MachineConfigPoolModel, machineConfigPool).catch((err) =>
                  errorModal({ error: err.message }),
                )
              }
              data-test="mcp-paused-button"
            >
              {isPaused ? t('public~Resume update') : t('public~Pause update')}
            </Button>
          )}
        </UpdatesGroup>
      );
};

const OtherNodes: React.FC<OtherNodesProps> = ({
  desiredVersion,
  hideIfComplete,
  machineConfigPools,
  updateStartedTime,
}) => {
  const otherNodes = machineConfigPools
    .filter((mcp) => !isMCPMaster(mcp) && !isMCPWorker(mcp))
    .sort(sortMCPsByCreationTimestamp);
  return (
    <>
      {otherNodes.map((mcp) => {
        return (
          <NodesUpdatesGroup
            desiredVersion={desiredVersion}
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
  const availableUpdates = getSortedAvailableUpdates(cv);
  const lastVersion = getLastCompletedUpdate(cv);
  const newestVersion = availableUpdates[0]?.version;
  const minorVersionIsNewer = newestVersion
    ? isMinorVersionNewer(lastVersion, newestVersion)
    : false;
  const secondNewestVersion = availableUpdates[1]?.version;
  const currentChannel = cv.spec.channel;
  const currentPrefix = splitClusterVersionChannel(currentChannel)?.prefix;
  const similarChannels = getSimilarClusterVersionChannels(cv, currentPrefix);
  const newerChannel = getNewerClusterVersionChannel(similarChannels, currentChannel);
  const clusterUpgradeableFalse = !!getConditionUpgradeableFalse(cv);
  const newestVersionIsBlocked =
    clusterUpgradeableFalse && minorVersionIsNewer && !isClusterExternallyManaged();
  const { t } = useTranslation();

  return (
    <div className="co-cluster-settings__updates-graph" data-test="cv-updates-graph">
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
                data-test="cv-more-updates-button"
              >
                {t('public~+ More')}
              </Button>
            )}
          </ChannelLine>
          <ChannelLine>
            {newestVersion && (
              <>
                <ChannelVersion updateBlocked={newestVersionIsBlocked}>
                  {newestVersion}
                </ChannelVersion>
                <ChannelVersionDot
                  channel={currentChannel}
                  updateBlocked={newestVersionIsBlocked}
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
  onCancel,
  children,
  queryString,
}) => (
  <Link
    onClick={onCancel}
    to={
      queryString
        ? `/settings/cluster/clusteroperators${queryString}`
        : '/settings/cluster/clusteroperators'
    }
  >
    {children}
  </Link>
);

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
  const masterMachinePoolConfig = getMCPByName(machineConfigPools, NodeTypes.master);
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
          desiredVersion={desiredVersion}
          machineConfigPool={masterMachinePoolConfig}
          name={NodeTypeNames.Master}
          updateStartedTime={updateStartedTime}
        />
      )}
      {workerMachineConfigPool && (
        <NodesUpdatesGroup
          desiredVersion={desiredVersion}
          divided
          machineConfigPool={workerMachineConfigPool}
          name={NodeTypeNames.Worker}
          updateStartedTime={updateStartedTime}
        />
      )}
      {machineConfigPools.length > 2 && (
        <OtherNodes
          desiredVersion={desiredVersion}
          machineConfigPools={machineConfigPools}
          updateStartedTime={updateStartedTime}
        />
      )}
    </UpdatesProgress>
  );
};

const ClusterServiceVersionResource: WatchK8sResource = {
  isList: true,
  kind: referenceForModel(ClusterServiceVersionModel),
};

export const ClusterNotUpgradeableAlert: React.FC<ClusterNotUpgradeableAlertProps> = ({
  cv,
  onCancel,
}) => {
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
  const availableUpdates = getSortedAvailableUpdates(cv);
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
                <ClusterOperatorsLink
                  onCancel={onCancel}
                  queryString="?rowFilter-cluster-operator-status=Cannot+update"
                >
                  {t('public~View ClusterOperators')}
                </ClusterOperatorsLink>
              </FlexItem>
            )}
            {notUpgradeableCSVsPresent && (
              // TODO:  update link to include filter once installed Operators filters are updated
              <FlexItem>
                <Link
                  onClick={onCancel}
                  to={`/k8s/ns/all-namespaces/${ClusterServiceVersionModel.plural}`}
                >
                  {t('public~View installed Operators')}
                </Link>
              </FlexItem>
            )}
          </Flex>
        )
      }
      data-test="cluster-settings-alerts-not-upgradeable"
    >
      <SyncMarkdownView
        content={clusterUpgradeableFalseCondition.message}
        inline
        options={{ simplifiedAutoLink: true }}
      />
    </Alert>
  );
};

export const MachineConfigPoolsArePausedAlert: React.FC<MachineConfigPoolsArePausedAlertProps> = ({
  machineConfigPools,
}) => {
  const { t } = useTranslation();
  const [clusterVersion] = useK8sWatchResource<ClusterVersionKind>({
    kind: clusterVersionReference,
    name: 'version',
  });
  // assume if 'worker' is editable, others are too
  const workerMachineConfigPoolIsEditable = useAccessReview({
    group: MachineConfigPoolModel.apiGroup,
    resource: MachineConfigPoolModel.plural,
    verb: 'patch',
    name: NodeTypes.worker,
  });
  const pausedMCPs = machineConfigPools
    .filter((mcp) => !isMCPMaster(mcp))
    .filter((mcp) => isMCPPaused(mcp));
  return clusterIsUpToDateOrUpdateAvailable(getClusterUpdateStatus(clusterVersion)) &&
    pausedMCPs.length > 0 ? (
    <Alert
      isInline
      title={t('public~{{resource}} updates are paused.', {
        resource: NodeModel.label,
      })}
      customIcon={<PauseCircleIcon />}
      actionLinks={
        workerMachineConfigPoolIsEditable && (
          <AlertActionLink
            onClick={() => Promise.all(getMCPsToPausePromises(pausedMCPs, false))}
            data-test="cluster-settings-alerts-paused-nodes-resume-link"
          >
            {t('public~Resume all updates')}
          </AlertActionLink>
        )
      }
      className="co-alert"
      data-test="cluster-settings-alerts-paused-nodes"
    />
  ) : null;
};

export const ClusterSettingsAlerts: React.FC<ClusterSettingsAlertsProps> = ({
  cv,
  machineConfigPools,
}) => {
  const { t } = useTranslation();

  if (isClusterExternallyManaged()) {
    return (
      <Alert
        variant="info"
        isInline
        title={t('public~Control plane is hosted.')}
        className="co-alert"
        data-test="cluster-settings-alerts-hosted"
      />
    );
  }
  return (
    <>
      {!!getConditionUpgradeableFalse(cv) && <ClusterNotUpgradeableAlert cv={cv} />}
      <MachineConfigPoolsArePausedAlert machineConfigPools={machineConfigPools} />
    </>
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

  const { t } = useTranslation();
  const canUpgrade = useCanClusterUpgrade();
  const [machineConfigPools] = useK8sWatchResource<MachineConfigPoolKind[]>(
    MachineConfigPoolsResource,
  );
  const serviceLevelTitle = useServiceLevelTitle();

  const desiredVersion = getDesiredClusterVersion(cv);
  const updateStartedTime = getStartedTimeForCVDesiredVersion(cv, desiredVersion);
  const workerMachineConfigPool = getMCPByName(machineConfigPools, NodeTypes.worker);
  if (new URLSearchParams(window.location.search).has('showVersions')) {
    clusterUpdateModal({ cv })
      .then(() => removeQueryArgument('showVersions'))
      .catch(_.noop);
  } else if (new URLSearchParams(window.location.search).has('showChannels')) {
    clusterChannelModal({ cv })
      .then(() => removeQueryArgument('showChannels'))
      .catch(_.noop);
  }

  return (
    <>
      <div className="co-m-pane__body">
        <div className="co-m-pane__body-group">
          <ClusterSettingsAlerts cv={cv} machineConfigPools={machineConfigPools} />
          <div className="co-cluster-settings">
            <div className="co-cluster-settings__row">
              <div className="co-cluster-settings__section co-cluster-settings__section--current">
                <dl className="co-m-pane__details co-cluster-settings__details">
                  <dt data-test="cv-current-version-header">
                    <CurrentVersionHeader cv={cv} />
                  </dt>
                  <dd data-test="cv-current-version">
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
                        <CurrentChannel cv={cv} canUpgrade={canUpgrade} />
                      </dd>
                    </dl>
                    <UpdateLink cv={cv} canUpgrade={canUpgrade} />
                  </div>
                </div>
                {clusterIsUpToDateOrUpdateAvailable(status) && (
                  <>
                    {!hasAvailableUpdates(cv) && hasNotRecommendedUpdates(cv) && (
                      <Alert
                        className="pf-v5-u-my-sm"
                        isInline
                        isPlain
                        title={t(
                          'public~Click "Select a version" to view versions with known issues.',
                        )}
                        variant="info"
                        data-test="cv-not-recommended-alert"
                      />
                    )}
                    <UpdatesGraph cv={cv} />
                    {workerMachineConfigPool && (
                      <UpdatesProgress>
                        <NodesUpdatesGroup
                          desiredVersion={desiredVersion}
                          divided
                          hideIfComplete
                          machineConfigPool={workerMachineConfigPool}
                          name={NodeTypeNames.Worker}
                          updateStartedTime={updateStartedTime}
                        />
                        {machineConfigPools.length > 2 && (
                          <OtherNodes
                            desiredVersion={desiredVersion}
                            hideIfComplete
                            machineConfigPools={machineConfigPools}
                            updateStartedTime={updateStartedTime}
                          />
                        )}
                      </UpdatesProgress>
                    )}
                  </>
                )}
                {(status === ClusterUpdateStatus.UpdatingAndFailing ||
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
            <ServiceLevel
              clusterID={clusterID}
              loading={
                <>
                  <dt>{serviceLevelTitle}</dt>
                  <dd>
                    <ServiceLevelLoading />
                  </dd>
                </>
              }
            >
              <>
                <dt>{serviceLevelTitle}</dt>
                <dd>
                  <ServiceLevelText clusterID={clusterID} />
                </dd>
              </>
            </ServiceLevel>
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
            {autoscalers && canUpgrade && (
              <>
                <dt data-test="cv-autoscaler">{t('public~Cluster autoscaler')}</dt>
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
          <>
            <TextContent>
              <Text component={TextVariants.p} className="help-block pf-v5-u-mb-lg">
                {t(
                  'public~There is a threshold for rendering update data which may cause gaps in the information below.',
                )}
              </Text>
            </TextContent>
            <div className="co-table-container">
              <table className="pf-v5-c-table pf-m-compact pf-m-border-rows">
                <thead className="pf-v5-c-table__thead">
                  <tr className="pf-v5-c-table__tr">
                    <th className="pf-v5-c-table__th">{t('public~Version')}</th>
                    <th className="pf-v5-c-table__th">{t('public~State')}</th>
                    <th className="pf-v5-c-table__th">{t('public~Started')}</th>
                    <th className="pf-v5-c-table__th">{t('public~Completed')}</th>
                    {releaseNotes && (
                      <th className="pf-v5-c-table__th pf-m-hidden pf-m-visible-on-md">
                        {t('public~Release notes')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="pf-v5-c-table__tbody">
                  {_.map(history, (update, i) => (
                    <tr className="pf-v5-c-table__tr" key={i}>
                      <td
                        className="pf-v5-c-table__td pf-m-break-word co-select-to-copy"
                        data-test-id="cv-details-table-version"
                      >
                        {update.version || '-'}
                      </td>
                      <td className="pf-v5-c-table__td" data-test-id="cv-details-table-state">
                        {update.state || '-'}
                      </td>
                      <td className="pf-v5-c-table__td">
                        <Timestamp timestamp={update.startedTime} />
                      </td>
                      <td className="pf-v5-c-table__td">
                        {update.completionTime ? (
                          <Timestamp timestamp={update.completionTime} />
                        ) : (
                          '-'
                        )}
                      </td>
                      {releaseNotes && (
                        <td className="pf-v5-c-table__td pf-m-hidden pf-m-visible-on-md">
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
          </>
        )}
      </div>
    </>
  );
};

export const ClusterOperatorTabPage: React.FC<ClusterOperatorTabPageProps> = ({ obj: cv }) => (
  <ClusterOperatorPage cv={cv} autoFocus={false} showTitle={false} />
);

export const ClusterSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const hasClusterAutoscaler = useFlag(FLAGS.CLUSTER_AUTOSCALER);
  const title = t('public~Cluster Settings');
  const resources: FirehoseResource[] = [
    {
      kind: clusterVersionReference,
      name: 'version',
      isList: false,
      prop: 'obj',
    },
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
      // t('public~Details')
      nameKey: 'public~Details',
      component: ClusterVersionDetailsTable,
    },
    {
      href: 'clusteroperators',
      // t(ClusterOperatorModel.labelPluralKey)
      nameKey: ClusterOperatorModel.labelPluralKey,
      component: ClusterOperatorTabPage,
    },
    {
      href: 'globalconfig',
      // t('public~Configuration')
      nameKey: 'public~Configuration',
      component: GlobalConfigPage,
    },
  ];
  const titleProviderValues = {
    telemetryPrefix: 'Cluster Settings',
    titlePrefix: title,
  };
  return (
    <PageTitleContext.Provider value={titleProviderValues}>
      <PageHeading title={<div data-test-id="cluster-settings-page-heading">{title}</div>} />
      <Firehose resources={resources}>
        <HorizontalNav pages={pages} resourceKeys={resourceKeys} />
      </Firehose>
    </PageTitleContext.Provider>
  );
};

type UpdateStatusProps = {
  cv: ClusterVersionKind;
};

type CVStatusMessagePopoverProps = {
  bodyContent: string;
  children: React.ReactNode;
};

type CVStatusMessageProps = {
  cv: ClusterVersionKind;
  isFailing?: boolean;
};

type CurrentChannelProps = {
  cv: K8sResourceKind;
  canUpgrade: boolean;
};

type CurrentVersionProps = {
  cv: ClusterVersionKind;
  canUpgrade?: boolean;
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
  desiredVersion: string;
  divided?: boolean;
  hideIfComplete?: boolean;
  name: string;
  machineConfigPool: MachineConfigPoolKind;
  updateStartedTime: string;
};

type OtherNodesProps = {
  desiredVersion: string;
  hideIfComplete?: boolean;
  machineConfigPools: MachineConfigPoolKind[];
  updateStartedTime: string;
};

type ClusterOperatorsLinkProps = {
  children: React.ReactNode;
  onCancel?: () => void;
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
  onCancel?: () => void;
};

type MachineConfigPoolsArePausedAlertProps = {
  machineConfigPools: MachineConfigPoolKind[];
};

type ClusterSettingsAlertsProps = {
  cv: ClusterVersionKind;
  machineConfigPools: MachineConfigPoolKind[];
};

type ClusterVersionDetailsTableProps = {
  obj: ClusterVersionKind;
  autoscalers?: K8sResourceKind[];
};

type ClusterVersionConditionsLinkProps = {
  cv: ClusterVersionKind;
};

type ClusterOperatorTabPageProps = {
  obj: ClusterVersionKind;
};
