/* eslint-disable @typescript-eslint/no-use-before-define */
import type { FC, ReactNode } from 'react';
import { useEffect, useRef, useMemo } from 'react';
import * as _ from 'lodash';
import { css } from '@patternfly/react-styles';
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
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListTerm,
  DescriptionListDescription,
  DescriptionListGroup,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';

import { AddCircleOIcon, PauseCircleIcon, PencilAltIcon, MagicIcon } from '@patternfly/react-icons';

import { useQueryParamsMutator } from '@console/internal/components/utils/router';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
} from '@console/operator-lifecycle-manager';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@openshift/dynamic-plugin-sdk';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import PaneBodyGroup from '@console/shared/src/components/layout/PaneBodyGroup';

import { ClusterOperatorPage } from './cluster-operator';
import {
  LazyClusterChannelModalOverlay,
  LazyClusterMoreUpdatesModalOverlay,
  LazyClusterUpdateModalOverlay,
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
  ClusterVersionKind,
  clusterVersionReference,
  getClusterID,
  getClusterOperatorVersion,
  getClusterUpdateStatus,
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
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { documentationURLs, getDocumentationURL, isManaged } from '../utils/documentation';
import { EmptyBox } from '../utils/status-box';
import { FieldLevelHelp } from '../utils/field-level-help';
import { Firehose } from '../utils/firehose';
import type { FirehoseResource } from '../utils/types';
import { HorizontalNav } from '../utils/horizontal-nav';
import { ReleaseNotesLink } from '../utils/release-notes-link';
import { ResourceLink, resourcePathFromModel } from '../utils/resource-link';
import { SectionHeading } from '../utils/headings';
import { togglePaused } from '../utils/workload-pause';
import { UpstreamConfigDetailsItem } from '../utils/details-page';
import { useAccessReview } from '../utils/rbac';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  isClusterExternallyManaged,
  useCanClusterUpgrade,
} from '@console/shared/src/hooks/useCanClusterUpgrade';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { PageTitleContext } from '@console/shared/src/components/pagetitle/PageTitleContext';
import { DescriptionListTermHelp } from '@console/shared/src/components/description-list/DescriptionListTermHelp';
import { useFlag } from '@console/shared/src/hooks/flag';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { FLAGS } from '@console/shared/src/constants';

import {
  ServiceLevel,
  useServiceLevelTitle,
  ServiceLevelText,
  ServiceLevelLoading,
} from '../utils/service-level';
import { hasAvailableUpdates, hasNotRecommendedUpdates } from '../../module/k8s/cluster-settings';
import { UpdateStatus } from './cluster-status';
import { ErrorModal } from '../modals/error-modal';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';

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

export const CurrentChannel: FC<CurrentChannelProps> = ({ cv, canUpgrade }) => {
  const { t } = useTranslation();
  const launchModal = useOverlay();
  const label = cv.spec.channel || t('public~Not configured');
  return canUpgrade ? (
    <Button
      icon={<PencilAltIcon />}
      iconPosition="end"
      type="button"
      isInline
      data-test-id="current-channel-update-link"
      onClick={() => launchModal(LazyClusterChannelModalOverlay, { cv: cv as ClusterVersionKind })}
      variant="link"
    >
      {label}
    </Button>
  ) : (
    <>{label}</>
  );
};

export const CurrentVersion: FC<CurrentVersionProps> = ({ cv }) => {
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
      <ReleaseNotesLink version={lastVersion} />
    </>
  ) : (
    <>{t('public~None')}</>
  );
};

export const UpdateLink: FC<CurrentVersionProps> = ({ cv, canUpgrade }) => {
  const launchModal = useOverlay();
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
        onClick={() => launchModal(LazyClusterUpdateModalOverlay, { cv })}
        data-test-id="cv-update-button"
      >
        {t('public~Select a version')}
      </Button>
    </div>
  ) : null;
};

export const CurrentVersionHeader: FC<CurrentVersionProps> = ({ cv }) => {
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

export const ChannelDocLink: FC<{}> = () => {
  const upgradeURL = getDocumentationURL(documentationURLs.understandingUpgradeChannels);
  const { t } = useTranslation();
  return (
    <ExternalLink href={upgradeURL} text={t('public~Learn more about OpenShift update channels')} />
  );
};

const ChannelHeader: FC<{}> = () => {
  const { t } = useTranslation();
  return (
    <DescriptionListTermHelp
      text={t('public~Channel')}
      textHelp={
        <Content>
          <Content component={ContentVariants.p}>
            {t(
              'public~Channels help to control the pace of updates and recommend the appropriate release versions. Update channels are tied to a minor version of OpenShift Container Platform, for example 4.5.',
            )}
          </Content>
          {!isManaged() && (
            <Content component={ContentVariants.p}>
              <ChannelDocLink />
            </Content>
          )}
        </Content>
      }
    />
  );
};

const Channel: FC<ChannelProps> = ({ children, endOfLife }) => {
  return (
    <div
      className={css('co-channel', {
        'co-channel--end-of-life': endOfLife,
      })}
      data-test="cv-channel"
    >
      {children}
    </div>
  );
};

const ChannelLine: FC<ChannelLineProps> = ({ children, start }) => {
  return <li className={css('co-channel-line', { 'co-channel-start': start })}>{children}</li>;
};

export const ChannelName: FC<ChannelNameProps> = ({ children, current }) => {
  return (
    <span
      className={css('co-channel-name', {
        'co-channel-name--current': current,
      })}
      data-test="cv-channel-name"
    >
      {children}
    </span>
  );
};

const ChannelPath: FC<ChannelPathProps> = ({ children, current }) => {
  return (
    <ul
      className={css('co-channel-path', {
        'co-channel-path--current': current,
      })}
    >
      {children}
    </ul>
  );
};

export const ChannelVersion: FC<ChannelVersionProps> = ({ children, current, updateBlocked }) => {
  const test = 'cv-channel-version';
  return (
    <span
      className={css('co-channel-version', {
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
      status="warning"
      variant="outline"
      className="pf-v6-u-ml-sm"
      data-test="cv-update-blocked"
    >
      {t('public~Update blocked')}
    </Label>
  );
};

const ChannelVersionDot: FC<ChannelVersionDotProps> = ({ current, updateBlocked, version }) => {
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
        className={css('co-channel-version-dot', {
          'co-channel-version-dot--current': current,
          'co-channel-version-dot--update-blocked': updateBlocked,
        })}
        data-test={updateBlocked ? `${test}-blocked` : test}
      />
    </Popover>
  ) : (
    <div
      className={css('co-channel-version-dot', {
        'co-channel-version-dot--current': current,
        'co-channel-version-dot--update-blocked': updateBlocked,
      })}
      data-test={test}
    ></div>
  );
};

const UpdatesBar: FC<UpdatesBarProps> = ({ children }) => {
  return <div className="co-cluster-settings__updates-bar">{children}</div>;
};

export const UpdatesGroup: FC<UpdatesGroupProps> = ({ children, divided }) => {
  return (
    <div
      className={css('co-cluster-settings__updates-group', {
        'co-cluster-settings__updates-group--divided': divided,
      })}
      data-test="cv-updates-group"
    >
      {children}
    </div>
  );
};

export const UpdatesProgress: FC<UpdatesProgressProps> = ({ children }) => {
  return (
    <div className="co-cluster-settings__updates-progress" data-test="cv-updates-progress">
      {children}
    </div>
  );
};

const UpdatesType: FC<UpdatesTypeProps> = ({ children }) => {
  return <div className="co-cluster-settings__updates-type">{children}</div>;
};

export const NodesUpdatesGroup: FC<NodesUpdatesGroupProps> = ({
  divided,
  desiredVersion,
  hideIfComplete,
  machineConfigPool,
  name,
  updateStartedTime,
}) => {
  const launchModal = useOverlay();
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
            <Link to={`/k8s/cluster/nodes?roles=${nodeRoleFilterValue}`}>
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
              className="pf-v6-u-mt-md"
              onClick={() =>
                togglePaused(MachineConfigPoolModel, machineConfigPool).catch((err) =>
                  launchModal(ErrorModal, { error: err.message }),
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

const OtherNodes: FC<OtherNodesProps> = ({
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

export const UpdatesGraph: FC<UpdatesGraphProps> = ({ cv }) => {
  const availableUpdates = getSortedAvailableUpdates(cv);
  const lastVersion = getLastCompletedUpdate(cv);
  const newestVersion = availableUpdates[0]?.version;
  const minorVersionIsNewer =
    lastVersion && newestVersion ? isMinorVersionNewer(lastVersion, newestVersion) : false;
  const secondNewestVersion = availableUpdates[1]?.version;
  const currentChannel = cv.spec.channel;
  const currentPrefix = splitClusterVersionChannel(currentChannel)?.prefix;
  const similarChannels = getSimilarClusterVersionChannels(cv, currentPrefix);
  const newerChannel = getNewerClusterVersionChannel(similarChannels, currentChannel);
  const clusterUpgradeableFalse = !!getConditionUpgradeableFalse(cv);
  const newestVersionIsBlocked =
    clusterUpgradeableFalse && minorVersionIsNewer && !isClusterExternallyManaged();
  const { t } = useTranslation();
  const launchModal = useOverlay();

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
                onClick={() => launchModal(LazyClusterMoreUpdatesModalOverlay, { cv })}
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

export const ClusterOperatorsLink: FC<ClusterOperatorsLinkProps> = ({
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

export const UpdateInProgress: FC<UpdateInProgressProps> = ({
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

export const ClusterNotUpgradeableAlert: FC<ClusterNotUpgradeableAlertProps> = ({
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
                <ClusterOperatorsLink onCancel={onCancel} queryString="?status=Cannot+update">
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

export const MachineConfigPoolsArePausedAlert: FC<MachineConfigPoolsArePausedAlertProps> = ({
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
    ?.filter((mcp) => !isMCPMaster(mcp))
    ?.filter((mcp) => isMCPPaused(mcp));
  return clusterIsUpToDateOrUpdateAvailable(getClusterUpdateStatus(clusterVersion)) &&
    pausedMCPs?.length > 0 ? (
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

export const ClusterSettingsAlerts: FC<ClusterSettingsAlertsProps> = ({
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

export const ClusterVersionDetailsTable: FC<ClusterVersionDetailsTableProps> = ({
  obj: cv,
  autoscalers,
}) => {
  const { getQueryArgument, removeQueryArgument } = useQueryParamsMutator();
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
  const launchModal = useOverlay();
  const modalOpenedRef = useRef(false);

  // Check URL params once to avoid re-reading on every cv change
  const hasShowVersions = useMemo(() => !!getQueryArgument('showVersions'), [getQueryArgument]);
  const hasShowChannels = useMemo(() => !!getQueryArgument('showChannels'), [getQueryArgument]);

  useEffect(() => {
    if (modalOpenedRef.current) {
      return;
    }
    if (hasShowVersions) {
      launchModal(LazyClusterUpdateModalOverlay, { cv });
      removeQueryArgument('showVersions');
      modalOpenedRef.current = true;
    } else if (hasShowChannels) {
      launchModal(LazyClusterChannelModalOverlay, { cv });
      removeQueryArgument('showChannels');
      modalOpenedRef.current = true;
    }
  }, [launchModal, cv, removeQueryArgument, hasShowVersions, hasShowChannels]);

  return (
    <>
      <PaneBody>
        <PaneBodyGroup>
          <ClusterSettingsAlerts cv={cv} machineConfigPools={machineConfigPools} />
          <div className="co-cluster-settings">
            <div className="co-cluster-settings__row">
              <div className="co-cluster-settings__section co-cluster-settings__section--current">
                <DescriptionList className="co-cluster-settings__details">
                  <DescriptionListGroup>
                    <DescriptionListTerm data-test="cv-current-version-header">
                      <CurrentVersionHeader cv={cv} />
                    </DescriptionListTerm>
                    <DescriptionListDescription data-test="cv-current-version">
                      <CurrentVersion cv={cv} />

                      {/* Add Success OLS Button for recent updates */}
                      {(() => {
                        const lastUpdate = cv.status?.history?.[0];
                        const isRecentUpdate =
                          lastUpdate?.state === 'Completed' &&
                          lastUpdate?.completionTime &&
                          new Date(lastUpdate.completionTime) >
                            new Date(Date.now() - 24 * 60 * 60 * 1000); // Within last 24 hours

                        return (
                          isRecentUpdate &&
                          status === ClusterUpdateStatus.UpToDate && (
                            <div className="pf-v6-u-mt-sm">
                              <UpdateWorkflowOLSButton phase="success" cv={cv} />
                            </div>
                          )
                        );
                      })()}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </div>
              <div className="co-cluster-settings__section">
                <div className="co-cluster-settings__row">
                  <DescriptionList className="co-cluster-settings__details co-cluster-settings__details--status">
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('public~Update status')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        <UpdateStatus cv={cv} />
                        {/* Add Failure OLS Button */}
                        {(status === ClusterUpdateStatus.Failing ||
                          status === ClusterUpdateStatus.UpdatingAndFailing ||
                          status === ClusterUpdateStatus.ErrorRetrieving) && (
                          <div className="pf-v6-u-mt-sm">
                            <UpdateWorkflowOLSButton phase="failure" cv={cv} />
                          </div>
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                  <div className="co-cluster-settings__row">
                    <DescriptionList className="co-cluster-settings__details">
                      <DescriptionListGroup>
                        <ChannelHeader />
                        <DescriptionListDescription>
                          <CurrentChannel cv={cv} canUpgrade={canUpgrade} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                    {/* Add Precheck OLS Button */}
                    {hasAvailableUpdates(cv) && (
                      <div className="pf-v6-u-mb-sm pf-v6-u-text-align-center">
                        <UpdateWorkflowOLSButton phase="precheck" cv={cv} />
                      </div>
                    )}
                    <UpdateLink cv={cv} canUpgrade={canUpgrade} />
                  </div>
                </div>
                {clusterIsUpToDateOrUpdateAvailable(status) && (
                  <>
                    {!hasAvailableUpdates(cv) && hasNotRecommendedUpdates(cv) && (
                      <Alert
                        className="pf-v6-u-my-sm"
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
                  <>
                    <UpdateInProgress
                      desiredVersion={desiredVersion}
                      machineConfigPools={machineConfigPools}
                      updateStartedTime={updateStartedTime}
                      workerMachineConfigPool={workerMachineConfigPool}
                    />
                    {/* Add Status OLS Button */}
                    <div className="pf-v6-u-mt-md pf-v6-u-text-align-center">
                      <UpdateWorkflowOLSButton phase="status" cv={cv} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </PaneBodyGroup>
        <DescriptionList>
          {window.SERVER_FLAGS.branding !== 'okd' && window.SERVER_FLAGS.branding !== 'azure' && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Subscription')}</DescriptionListTerm>
              <DescriptionListDescription>
                <ExternalLink
                  text={t('public~OpenShift Cluster Manager')}
                  href={getOCMLink(clusterID)}
                />
                .
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
          <ServiceLevel
            clusterID={clusterID}
            loading={
              <DescriptionListGroup>
                <DescriptionListTerm>{serviceLevelTitle}</DescriptionListTerm>
                <DescriptionListDescription>
                  <ServiceLevelLoading />
                </DescriptionListDescription>
              </DescriptionListGroup>
            }
          >
            <DescriptionListGroup>
              <DescriptionListTerm>{serviceLevelTitle}</DescriptionListTerm>
              <DescriptionListDescription>
                <ServiceLevelText clusterID={clusterID} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </ServiceLevel>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('public~Cluster ID')}</DescriptionListTerm>
            <DescriptionListDescription
              className="co-break-all co-select-to-copy"
              data-test-id="cv-details-table-cid"
            >
              {clusterID}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('public~Desired release image')}</DescriptionListTerm>
            <DescriptionListDescription
              className="co-break-all co-select-to-copy"
              data-test-id="cv-details-table-image"
            >
              {imageParts.length === 2 ? (
                <>
                  <span className="pf-v6-u-text-color-subtle">{imageParts[0]}@</span>
                  {imageParts[1]}
                </>
              ) : (
                desiredImage || '-'
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('public~Cluster version configuration')}</DescriptionListTerm>
            <DescriptionListDescription>
              <ResourceLink kind={referenceForModel(ClusterVersionModel)} name={cv.metadata.name} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <UpstreamConfigDetailsItem resource={cv} />
          {autoscalers && canUpgrade && (
            <DescriptionListGroup>
              <DescriptionListTerm data-test="cv-autoscaler">
                {t('public~Cluster autoscaler')}
              </DescriptionListTerm>
              <DescriptionListDescription>
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
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Update history')} />
        {_.isEmpty(history) ? (
          <EmptyBox label={t('public~History')} />
        ) : (
          <>
            <Content>
              <Content component={ContentVariants.p} className="help-block pf-v6-u-mb-lg">
                {t(
                  'public~There is a threshold for rendering update data which may cause gaps in the information below.',
                )}
              </Content>
            </Content>
            <div className="co-table-container">
              <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
                <thead className="pf-v6-c-table__thead">
                  <tr className="pf-v6-c-table__tr">
                    <th className="pf-v6-c-table__th">{t('public~Version')}</th>
                    <th className="pf-v6-c-table__th">{t('public~State')}</th>
                    <th className="pf-v6-c-table__th">{t('public~Started')}</th>
                    <th className="pf-v6-c-table__th">{t('public~Completed')}</th>
                    {releaseNotes && (
                      <th className="pf-v6-c-table__th pf-m-hidden pf-m-visible-on-md">
                        {t('public~Release notes')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="pf-v6-c-table__tbody">
                  {_.map(history, (update, i) => (
                    <tr className="pf-v6-c-table__tr" key={i}>
                      <td
                        className="pf-v6-c-table__td pf-m-break-word co-select-to-copy"
                        data-test-id="cv-details-table-version"
                      >
                        {update.version || '-'}
                      </td>
                      <td className="pf-v6-c-table__td" data-test-id="cv-details-table-state">
                        {update.state || '-'}
                      </td>
                      <td className="pf-v6-c-table__td">
                        <Timestamp timestamp={update.startedTime} />
                      </td>
                      <td className="pf-v6-c-table__td">
                        {update.completionTime ? (
                          <Timestamp timestamp={update.completionTime} />
                        ) : (
                          '-'
                        )}
                      </td>
                      {releaseNotes && (
                        <td className="pf-v6-c-table__td pf-m-hidden pf-m-visible-on-md">
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
      </PaneBody>
    </>
  );
};

export const ClusterOperatorTabPage: FC<ClusterOperatorTabPageProps> = ({ obj: cv }) => (
  <ClusterOperatorPage cv={cv} autoFocus={false} showTitle={false} />
);

export const ClusterSettingsPage: FC = () => {
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

type CurrentChannelProps = {
  cv: K8sResourceKind;
  canUpgrade: boolean;
};

type CurrentVersionProps = {
  cv: ClusterVersionKind;
  canUpgrade?: boolean;
};

type ChannelProps = {
  children: ReactNode;
  endOfLife?: boolean;
};

type ChannelLineProps = {
  children?: ReactNode;
  start?: boolean;
};

type ChannelNameProps = {
  children: ReactNode;
  current?: boolean;
};

type ChannelPathProps = {
  children: ReactNode;
  current?: boolean;
};

type ChannelVersionProps = {
  children: ReactNode;
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
  children: ReactNode;
};

type UpdatesGraphProps = {
  cv: ClusterVersionKind;
};

type UpdatesGroupProps = {
  children: ReactNode;
  divided?: boolean;
};

type UpdatesProgressProps = {
  children: ReactNode;
};

type UpdatesTypeProps = {
  children: ReactNode;
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
  children: ReactNode;
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

type ClusterOperatorTabPageProps = {
  obj: ClusterVersionKind;
};

interface UpdateWorkflowOLSButtonProps {
  phase: 'precheck' | 'failure' | 'status' | 'success';
  cv: ClusterVersionKind;
  className?: string;
}

const UpdateWorkflowOLSButton: FC<UpdateWorkflowOLSButtonProps> = ({ phase, cv, className }) => {
  const { t } = useTranslation();
  const isOLSAvailable = useFlag('LIGHTSPEED_CONSOLE');
  const fireTelemetryEvent = useTelemetry();

  // ClusterVersion subset helper functions for different workflow phases
  const getPreUpdateClusterVersionSubset = () => ({
    metadata: {
      name: cv.metadata?.name,
      creationTimestamp: cv.metadata?.creationTimestamp,
    },
    spec: {
      channel: cv.spec?.channel,
      clusterID: cv.spec?.clusterID,
      desiredUpdate: cv.spec?.desiredUpdate,
      upstream: cv.spec?.upstream,
    },
    status: {
      desired: cv.status?.desired,
      conditions: cv.status?.conditions,
      availableUpdates: cv.status?.availableUpdates,
      conditionalUpdates: cv.status?.conditionalUpdates,
      observedGeneration: cv.status?.observedGeneration,
    },
  });

  const getPostUpdateClusterVersionSubset = () => ({
    metadata: {
      name: cv.metadata?.name,
    },
    spec: {
      channel: cv.spec?.channel,
      clusterID: cv.spec?.clusterID,
    },
    status: {
      desired: cv.status?.desired,
      history: cv.status?.history?.slice(0, 2), // Just last 2 updates
      conditions: cv.status?.conditions?.filter((c) =>
        ['Available', 'Progressing', 'Failing'].includes(c.type),
      ),
      observedGeneration: cv.status?.observedGeneration,
    },
  });

  const getMidUpdateClusterVersionSubset = () => ({
    metadata: {
      name: cv.metadata?.name,
    },
    spec: {
      channel: cv.spec?.channel,
      clusterID: cv.spec?.clusterID,
    },
    status: {
      desired: cv.status?.desired,
      history: cv.status?.history?.slice(0, 1), // Current update attempt
      conditions: cv.status?.conditions, // Full conditions for NLP analysis
      observedGeneration: cv.status?.observedGeneration,
    },
  });

  // Find the OLS extension provided by lightspeed-console plugin
  const [olsExtension] = useExtensions<any>(
    (e): e is any =>
      e.type === 'console.action/provider' && e.properties?.contextId === 'ols-open-handler',
  );

  // Don't render if OLS is not available
  if (!isOLSAvailable || !olsExtension) {
    return null;
  }

  // Helper functions for data processing
  const getCurrentVersionSafe = () => getLastCompletedUpdate(cv);
  const getDesiredVersionSafe = () => getDesiredClusterVersion(cv);
  const getUpdateStatus = () => getClusterUpdateStatus(cv);
  const getAvailableUpdatesSafe = () => getSortedAvailableUpdates(cv);

  const calculateUpdateDuration = (startTime?: string, endTime?: string): string | null => {
    if (!startTime || !endTime) {
      return null;
    }
    const duration = Math.round(
      (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000,
    );
    return duration > 0 ? `${duration} minutes` : null;
  };

  // Enhanced prompt generation with ClusterVersion context only
  const generateEnhancedPrompt = (): string => {
    const currentVersion = getCurrentVersionSafe();
    const desiredVersion = getDesiredVersionSafe();
    const status = getUpdateStatus();
    const availableUpdates = getAvailableUpdatesSafe();
    const environment = isManaged() ? 'managed' : 'self-managed';
    const updateChannel = cv.spec?.channel || 'unknown';

    switch (phase) {
      case 'precheck': {
        const targetVersion = availableUpdates[0]?.version;
        const recentFailures =
          cv.status?.history?.slice(0, 5).filter((h) => h.state !== 'Completed').length || 0;

        return `I'm planning to update my ${environment} OpenShift cluster from ${currentVersion} to ${targetVersion} via ${updateChannel} channel.

Recent update history shows ${recentFailures} non-successful attempts in the last 5 updates.

Please provide comprehensive pre-update guidance including:
1. Specific prerequisites and compatibility checks for this version jump
2. Resource requirements and capacity planning
3. Backup and rollback strategies
4. Risk assessment based on the cluster configuration in the attached data
5. Estimated update duration and maintenance window planning
6. Any known issues or breaking changes for this update path

Focus on actionable steps I should take before starting the update. Use the attached ClusterVersion data to assess current cluster state and readiness.`;
      }

      case 'failure': {
        const failureConditions =
          cv.status?.conditions?.filter(
            (c) => c.type === 'Failing' || (c.type === 'Progressing' && c.status === 'False'),
          ) || [];

        const updateStartTime = cv.status?.history?.find((h) => h.version === desiredVersion)
          ?.startedTime;
        const failureDuration = updateStartTime
          ? Math.round((Date.now() - new Date(updateStartTime).getTime()) / 60000)
          : null;

        return `My ${environment} OpenShift cluster update has failed.

Update Details:
- From: ${currentVersion} to ${desiredVersion}
- Channel: ${updateChannel}
- Status: ${status}
${failureDuration ? `- Failed after: ${failureDuration} minutes` : ''}

Key failure conditions:
${failureConditions
  .map((c) => `- ${c.type}: ${c.message || c.reason || 'No details available'}`)
  .join('\n')}

Please analyze the attached ClusterVersion conditions and help me:
1. Analyze the root cause of this update failure
2. Provide step-by-step troubleshooting guidance
3. Suggest remediation actions to resolve the issues
4. Advise on safe recovery or rollback options if needed
5. Recommend preventive measures for future updates

Use natural language processing on the condition messages to understand what components may need attention. Request specific resource data if you need to investigate particular operators, nodes, or machine config pools.`;
      }

      case 'status': {
        const progressCondition = cv.status?.conditions?.find((c) => c.type === 'Progressing');
        const updateStartTime2 = cv.status?.history?.find((h) => h.version === desiredVersion)
          ?.startedTime;
        const currentDuration = updateStartTime2
          ? Math.round((Date.now() - new Date(updateStartTime2).getTime()) / 60000)
          : null;

        return `My ${environment} OpenShift cluster is currently updating from ${currentVersion} to ${desiredVersion}.

Update Details:
- Channel: ${updateChannel}
- Status: ${status}
${currentDuration ? `- Duration so far: ${currentDuration} minutes` : ''}

Current Progress: ${progressCondition?.message || 'Update in progress'}

Please analyze the attached ClusterVersion data and help me:
1. Assess if the update is progressing normally
2. Identify any potential issues or bottlenecks from the condition messages
3. Provide guidance on expected timeline and next steps
4. Advise on monitoring best practices during the update
5. Suggest actions if the update appears stuck or slow

Use the condition messages to understand the current state and request specific component data if needed for deeper analysis.`;
      }

      case 'success': {
        const completedUpdate = cv.status?.history?.find(
          (h) => h.state === 'Completed' && h.version === currentVersion,
        );
        const updateDuration = completedUpdate
          ? calculateUpdateDuration(completedUpdate.startedTime, completedUpdate.completionTime)
          : null;

        return `My ${environment} OpenShift cluster has successfully updated to version ${currentVersion}.

Update Details:
- Previous version: ${cv.status?.history?.[1]?.version || 'unknown'}
- Channel: ${updateChannel}
- Duration: ${updateDuration || 'unknown'}
- Completed: ${completedUpdate?.completionTime || 'unknown'}

Please review the attached ClusterVersion data and help me:
1. Verify the update completed successfully
2. Recommend post-update validation steps
3. Guide me through cluster health checks
4. Suggest any needed configuration updates
5. Advise on monitoring for post-update issues

Focus on what I can validate from the ClusterVersion status and what additional component checks you recommend.`;
      }

      default:
        return `I need help with my ${environment} OpenShift cluster update workflow.`;
    }
  };

  // ClusterVersion-only attachment creation for different workflow phases
  const createPrecheckAttachments = () => [
    {
      attachmentType: 'YAML' as const,
      kind: 'ClusterVersion',
      name: 'pre-update-cluster-version',
      namespace: undefined,
      value: JSON.stringify(getPreUpdateClusterVersionSubset(), null, 2),
    },
  ];

  const createFailureAttachments = () => [
    {
      attachmentType: 'YAML' as const,
      kind: 'ClusterVersion',
      name: 'failure-cluster-version',
      namespace: undefined,
      value: JSON.stringify(getMidUpdateClusterVersionSubset(), null, 2),
    },
  ];

  const createStatusAttachments = () => [
    {
      attachmentType: 'YAML' as const,
      kind: 'ClusterVersion',
      name: 'status-cluster-version',
      namespace: undefined,
      value: JSON.stringify(getMidUpdateClusterVersionSubset(), null, 2),
    },
  ];

  const createSuccessAttachments = () => [
    {
      attachmentType: 'YAML' as const,
      kind: 'ClusterVersion',
      name: 'success-cluster-version',
      namespace: undefined,
      value: JSON.stringify(getPostUpdateClusterVersionSubset(), null, 2),
    },
  ];

  const createWorkflowAttachments = () => {
    switch (phase) {
      case 'precheck':
        return createPrecheckAttachments();
      case 'failure':
        return createFailureAttachments();
      case 'status':
        return createStatusAttachments();
      case 'success':
        return createSuccessAttachments();
      default:
        return [];
    }
  };

  const getButtonText = (): string => {
    switch (phase) {
      case 'precheck':
        return t('public~Ask Lightspeed about update prerequisites');
      case 'failure':
        return t('public~Ask Lightspeed about update failures');
      case 'status':
        return t('public~Ask Lightspeed about update progress');
      case 'success':
        return t('public~Ask Lightspeed about update verification');
      default:
        return t('public~Ask Lightspeed');
    }
  };

  const handleClick = () => {
    const openOLS = olsExtension.properties.provider();
    const prompt = generateEnhancedPrompt();
    const attachments = createWorkflowAttachments();

    // Open OLS with workflow-specific context and cluster data
    openOLS(prompt, attachments);

    // Track usage by workflow phase with ClusterVersion context only
    fireTelemetryEvent('OLS Update Workflow Button Clicked', {
      source: 'cluster-settings',
      updatePhase: phase,
      clusterVersion: getCurrentVersionSafe(),
      updateStatus: getUpdateStatus(),
      environment: isManaged() ? 'managed' : 'self-managed',
      updateChannel: cv.spec?.channel,
      attachmentCount: attachments.length,
    });
  };

  return (
    <Button
      variant="link"
      size="sm"
      onClick={handleClick}
      icon={<MagicIcon />}
      iconPosition="start"
      className={className}
      data-test={`ols-update-${phase}`}
      aria-label={getButtonText()}
    >
      {getButtonText()}
    </Button>
  );
};
