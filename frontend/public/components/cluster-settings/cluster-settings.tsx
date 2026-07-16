/* eslint-disable @typescript-eslint/no-use-before-define */
import type { FC, ReactNode } from 'react';
import { useEffect, useRef, useMemo, useState } from 'react';
import * as _ from 'lodash';
import { css } from '@patternfly/react-styles';
import * as semver from 'semver';
import {
  Alert,
  AlertActionLink,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardExpandableContent,
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
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import {
  RhUiAddCircleIcon,
  RhUiPauseCircleIcon,
  RhUiEditIcon,
  RhUiInProgressIcon,
} from '@patternfly/react-icons';

import { UpdateWorkflowOLSButton } from '@console/shared/src/components/cluster-updates/explain-button';
import {
  hasAvailableUpdates,
  hasOperatorIssues,
  determineWorkflowButtons,
} from '@console/shared/src/components/cluster-updates/workflow-utils';
import { FEATURE_FLAG_LIGHTSPEED_PLUGIN } from '@console/shared/src/components/cluster-updates/constants';

import { useQueryParamsMutator } from '@console/shared/src/hooks/useQueryParamsMutator';
import { MarkdownView } from '@console/shared/src/components/markdown/MarkdownView';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
} from '@console/operator-lifecycle-manager';
import { WatchK8sResource, useAccessReview } from '@console/dynamic-plugin-sdk';
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
  ClusterVersionConditionType,
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
import { HorizontalNav } from '../utils/horizontal-nav';
import { ReleaseNotesLink } from '../utils/release-notes-link';
import { ResourceLink, resourcePathFromModel } from '../utils/resource-link';
import { SectionHeading } from '../utils/headings';
import { togglePaused } from '../utils/workload-pause';
import { UpstreamConfigDetailsItem } from '../utils/details-page';

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
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { FLAGS } from '@console/shared/src/constants/common';

import {
  ServiceLevel,
  useServiceLevelTitle,
  ServiceLevelText,
  ServiceLevelLoading,
} from '../utils/service-level';
import { hasNotRecommendedUpdates } from '../../module/k8s/cluster-settings';
import { UpdateStatus } from './cluster-status';
import { ErrorModal } from '../modals/error-modal';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';

const clusterAutoscalerReference = referenceForModel(ClusterAutoscalerModel);

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

const CurrentChannel: FC<CurrentChannelProps> = ({ cv, canUpgrade }) => {
  const { t } = useTranslation('public');
  const launchModal = useOverlay();
  const label = cv.spec.channel || t('Not configured');
  return canUpgrade ? (
    <Button
      icon={<RhUiEditIcon />}
      iconPosition="end"
      type="button"
      isInline
      data-test-id="current-channel-update-link"
      data-test="current-channel-update-link"
      onClick={() => launchModal(LazyClusterChannelModalOverlay, { cv: cv as ClusterVersionKind })}
      variant="link"
    >
      {label}
    </Button>
  ) : (
    <>{label}</>
  );
};

const CurrentVersion: FC<CurrentVersionProps> = ({ cv }) => {
  const desiredVersion = getDesiredClusterVersion(cv);
  const lastVersion = getLastCompletedUpdate(cv);
  const status = getClusterUpdateStatus(cv);
  const { t } = useTranslation('public');

  if (clusterIsUpToDateOrUpdateAvailable(status)) {
    return desiredVersion ? (
      <>
        <div>
          <span
            className="co-select-to-copy"
            data-test="cluster-version"
            data-test-id="cluster-version"
          >
            {desiredVersion}
          </span>
        </div>
        <ReleaseNotesLink version={getCurrentVersion(cv)} />
      </>
    ) : (
      <>
        <YellowExclamationTriangleIcon />
        &nbsp;{t('Unknown')}
      </>
    );
  }

  return lastVersion ? (
    <>
      <div>
        <span
          className="co-select-to-copy"
          data-test="cluster-version"
          data-test-id="cluster-version"
        >
          {lastVersion}
        </span>
      </div>
      <ReleaseNotesLink version={lastVersion} />
    </>
  ) : (
    <>{t('None')}</>
  );
};

const UpdateLink: FC<CurrentVersionProps> = ({ cv, canUpgrade }) => {
  const launchModal = useOverlay();
  // assume if 'worker' is editable, others are too
  const workerMachineConfigPoolIsEditable = useAccessReview({
    group: MachineConfigPoolModel.apiGroup,
    resource: MachineConfigPoolModel.plural,
    verb: 'patch',
    name: NodeTypes.worker,
  });
  const status = getClusterUpdateStatus(cv);
  const { t } = useTranslation('public');
  const hasNotRecommended = hasNotRecommendedUpdates(cv);
  // Handle ErrorRetrieving separately - allow version selection regardless of other conditions
  if (
    canUpgrade &&
    status === ClusterUpdateStatus.ErrorRetrieving &&
    workerMachineConfigPoolIsEditable
  ) {
    return (
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
    );
  }

  return canUpgrade &&
    (hasAvailableUpdates(cv) || hasNotRecommended) &&
    (status === ClusterUpdateStatus.UpdatesAvailable ||
      status === ClusterUpdateStatus.Updating ||
      status === ClusterUpdateStatus.Failing ||
      (status === ClusterUpdateStatus.UpToDate && hasNotRecommended)) &&
    workerMachineConfigPoolIsEditable ? (
    <div className="co-cluster-settings__details">
      <Button
        variant="primary"
        type="button"
        onClick={() => launchModal(LazyClusterUpdateModalOverlay, { cv })}
        data-test-id="cv-update-button"
        data-test="cv-update-button"
      >
        {t('Select a version')}
      </Button>
    </div>
  ) : null;
};

const CurrentVersionHeader: FC<CurrentVersionProps> = ({ cv }) => {
  const status = getClusterUpdateStatus(cv);
  const { t } = useTranslation('public');
  return (
    <>
      {clusterIsUpToDateOrUpdateAvailable(status)
        ? t('Current version')
        : t('Last completed version')}
    </>
  );
};

export const ChannelDocLink: FC<{}> = () => {
  const upgradeURL = getDocumentationURL(documentationURLs.understandingUpgradeChannels);
  const { t } = useTranslation('public');
  return <ExternalLink href={upgradeURL} text={t('Learn more about OpenShift update channels')} />;
};

const ChannelHeader: FC<{}> = () => {
  const { t } = useTranslation('public');
  return (
    <DescriptionListTermHelp
      text={t('Channel')}
      textHelp={
        <Content>
          <Content component={ContentVariants.p}>
            {t(
              'Channels help to control the pace of updates and recommend the appropriate release versions. Update channels are tied to a minor version of OpenShift Container Platform, for example 4.5.',
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

const ChannelName: FC<ChannelNameProps> = ({ children, current }) => {
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

const ChannelVersion: FC<ChannelVersionProps> = ({ children, current, updateBlocked }) => {
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
  const { t } = useTranslation('public');

  return (
    <Label
      status="warning"
      variant="outline"
      className="pf-v6-u-ml-sm"
      data-test="cv-update-blocked"
    >
      {t('Update blocked')}
    </Label>
  );
};

const ChannelVersionDot: FC<ChannelVersionDotProps> = ({ current, updateBlocked, version }) => {
  const releaseNotesLink = getReleaseNotesLink(version);
  const { t } = useTranslation('public');
  const test = 'cv-channel-version-dot';

  return releaseNotesLink || updateBlocked ? (
    <Popover
      headerContent={
        <>
          {t('Version')} {version}
          {updateBlocked && <UpdateBlockedLabel />}
        </>
      }
      bodyContent={
        <>
          {updateBlocked && (
            <p data-test="cv-channel-version-dot-blocked-info">
              {t(
                'See the alert above the visualization for instructions on how to unblock this version.',
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

const UpdatesGroup: FC<UpdatesGroupProps> = ({ children, divided }) => {
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

const UpdatesProgress: FC<UpdatesProgressProps> = ({ children }) => {
  return (
    <div className="co-cluster-settings__updates-progress" data-test="cv-updates-progress">
      {children}
    </div>
  );
};

const UpdatesType: FC<UpdatesTypeProps> = ({ children }) => {
  return <div className="co-cluster-settings__updates-type">{children}</div>;
};

const NodesUpdatesGroup: FC<NodesUpdatesGroupProps> = ({
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
  const renderedConfigIsUpdated =
    renderedConfig?.metadata?.annotations?.[
      'machineconfiguration.openshift.io/release-image-version'
    ] === desiredVersion;
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
  const percentMCPNodes = Math.round((updatedMCPNodes / totalMCPNodes) * 100);
  const isUpdated = percentMCPNodes === 100;
  const nodeRoleFilterValue = isMaster ? 'control-plane' : mcpName;
  const { t } = useTranslation('public');
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
                  '{{name}} {{resource}} may continue to update after the update of {{master}} {{resource}} and {{resource2}} are complete.',
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
              title={t('{{updatedMCPNodes}} of {{totalMCPNodes}}', {
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
              {isPaused ? t('Resume update') : t('Pause update')}
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

const UpdatesGraph: FC<UpdatesGraphProps> = ({ cv }) => {
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
  const { t } = useTranslation('public');
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
                {t('+ More')}
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
        <ChannelName current>{t('{{currentChannel}} channel', { currentChannel })}</ChannelName>
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
          <ChannelName>{t('{{newerChannel}} channel', { newerChannel })}</ChannelName>
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

const ClusterOperatorsLink: FC<ClusterOperatorsLinkProps> = ({
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

const UpdateInProgress: FC<UpdateInProgressProps> = ({
  desiredVersion,
  machineConfigPools,
  workerMachineConfigPool,
  updateStartedTime,
}) => {
  const [clusterOperators] = useK8sWatchResource<ClusterOperator[]>(ClusterOperatorsResource);
  const totalOperatorsCount = clusterOperators?.length || 0;
  const updatedOperatorsCount = getUpdatedOperatorsCount(clusterOperators, desiredVersion);
  const percentOperators = Math.round((updatedOperatorsCount / totalOperatorsCount) * 100);
  const masterMachinePoolConfig = getMCPByName(machineConfigPools, NodeTypes.master);
  const { t } = useTranslation('public');

  return (
    <UpdatesProgress>
      <UpdatesGroup>
        <UpdatesType>
          <ClusterOperatorsLink>{t(ClusterOperatorModel.labelPluralKey)}</ClusterOperatorsLink>
        </UpdatesType>
        <UpdatesBar>
          <Progress
            title={t('{{updatedOperatorsCount}} of {{totalOperatorsCount}}', {
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

// Helper function to get a condition by type from cluster version
const getConditionOfType = (cv: ClusterVersionKind, type: ClusterVersionConditionType) =>
  cv.status?.conditions?.find((c) => c.type === type);

// Helper function to detect operator issues (degraded or unavailable)
// Returns array of operator details for operators with problems
const detectOperatorIssues = (
  clusterOperators?: ClusterOperator[],
): Array<{ name: string; issue: string; condition: any }> => {
  if (!clusterOperators || clusterOperators.length === 0) {
    return [];
  }

  return clusterOperators
    .map((operator) => {
      const operatorConditions = operator.status?.conditions || [];
      const degraded = operatorConditions.find((c) => c.type === 'Degraded' && c.status === 'True');
      const available = operatorConditions.find(
        (c) => c.type === 'Available' && c.status === 'False',
      );

      if (degraded) {
        return {
          name: operator.metadata?.name || 'unknown',
          issue: 'degraded',
          condition: degraded,
        };
      }
      if (available) {
        return {
          name: operator.metadata?.name || 'unknown',
          issue: 'not available',
          condition: available,
        };
      }
      return null;
    })
    .filter(Boolean);
};

// Helper function to parse and improve error messages for better user experience
const parseUpdateFailureMessage = (
  rawMessage: string,
  t: (key: string, options?: { [key: string]: string | number }) => string,
  cv?: ClusterVersionKind,
  clusterOperators?: ClusterOperator[],
): { title: string; message: string; operatorDetails?: string } => {
  // Check for operator-specific failures first, regardless of rawMessage
  // This ensures we always provide detailed operator information when available
  if (cv && clusterOperators) {
    const operatorIssueDetails = detectOperatorIssues(clusterOperators);

    // If we have operator issues, return operator-specific message with technical details
    if (operatorIssueDetails.length > 0) {
      const operatorList = operatorIssueDetails
        .map((detail) => `${detail.name} (${detail.issue})`)
        .join(', ');

      const baseMessage = t(
        'public~{{count}} cluster operators are experiencing issues and need to be healthy before the cluster can be updated.',
        { count: operatorIssueDetails.length },
      );

      // Build detailed operator condition information for technical details
      const operatorDetailsMarkdown = operatorIssueDetails
        .map((detail) => {
          const conditionInfo = detail.condition.message
            ? `\n  **Message**: ${detail.condition.message}`
            : '';
          const conditionReason = detail.condition.reason
            ? `\n  **Reason**: ${detail.condition.reason}`
            : '';
          return `**${detail.name}**\n  **Status**: ${detail.condition.type}=${detail.condition.status}${conditionReason}${conditionInfo}`;
        })
        .join('\n\n');

      return {
        title: t('public~Cluster operators are experiencing issues'),
        message: t(
          'public~{{baseMessage}}\n\nAffected operators: {{operators}}\n\nCheck the operator status and ensure they have sufficient resources and network connectivity.',
          { baseMessage, operators: operatorList },
        ),
        operatorDetails: operatorDetailsMarkdown,
      };
    }
  }

  // If rawMessage is empty AND no operator failures, check if cluster actually has issues
  if (!rawMessage) {
    // Check ClusterVersion conditions to see if there are real failures
    const conditions = cv?.status?.conditions || [];
    const hasFailing = conditions.some((c) => c.type === 'Failing' && c.status === 'True');
    const isNotUpgradeable = conditions.some(
      (c) => c.type === 'Upgradeable' && c.status === 'False',
    );
    const hasRetrievalFailure = conditions.some(
      (c) => c.type === 'RetrievedUpdates' && c.status === 'False',
    );
    const hasReleaseIssue = conditions.some(
      (c) => c.type === 'ReleaseAccepted' && c.status === 'False',
    );

    // If cluster has actual issues but no message, return generic fallback
    if (hasFailing || isNotUpgradeable || hasRetrievalFailure || hasReleaseIssue) {
      return {
        title: t('public~Cluster has issues preventing updates'),
        message: t(
          'public~The cluster is not ready to update. Check your cluster operator status and resolve any issues before you try to update.',
        ),
      };
    }

    // Cluster is healthy and ready to upgrade - no message needed
    return {
      title: '',
      message: '',
    };
  }

  // Pattern: Update already in progress (informational, not an error)
  // This message comes from Upgradeable condition during updates
  if (
    rawMessage.includes('An update is already in progress') ||
    rawMessage.includes('UpdateInProgress')
  ) {
    // Return empty - this is normal during updates, not a blocking issue
    // The isProgressing check above will show the "Updating" status
    return {
      title: '',
      message: '',
    };
  }

  // Pattern: ClusterVersionOverridesSet
  if (
    rawMessage.includes('ClusterVersionOverridesSet') ||
    rawMessage.includes('cluster version overrides prevents upgrades')
  ) {
    return {
      title: t('public~Update blocked by cluster version overrides'),
      message: t(
        'public~Your cluster has version overrides configured that prevent automatic updates. To continue, remove the overrides from your ClusterVersion object.',
      ),
    };
  }

  // Pattern: ClusterOperatorsDegraded
  if (
    rawMessage.includes('ClusterOperatorsDegraded') ||
    rawMessage.includes('ClusterOperatorNotAvailable')
  ) {
    return {
      title: t('public~Update blocked by degraded cluster operators'),
      message: t(
        'public~Some cluster operators are in a degraded or unavailable state. Fix the operator issues before you try to update the cluster.',
      ),
    };
  }

  // Pattern: Validation failures
  if (rawMessage.includes('validation failed') || rawMessage.includes('Validation error')) {
    return {
      title: t('public~Update validation failed'),
      message: t(
        'public~The update payload failed validation checks. This might indicate issues with the update manifest or cluster configuration.',
      ),
    };
  }

  // Pattern: Network/connectivity issues
  if (
    rawMessage.includes('unable to retrieve') ||
    rawMessage.includes('connection refused') ||
    rawMessage.includes('timeout')
  ) {
    return {
      title: t('public~Update failed due to connectivity issues'),
      message: t(
        'public~Your system cannot download or validate the update payload. Check your network connectivity and registry access.',
      ),
    };
  }

  // Pattern: Insufficient resources
  if (rawMessage.includes('insufficient resources') || rawMessage.includes('out of disk space')) {
    return {
      title: t('public~Update failed due to insufficient resources'),
      message: t(
        'public~The cluster does not have enough resources to complete the update. Make sure you have enough disk space and memory available.',
      ),
    };
  }

  // Pattern: Update blocked by policy
  if (rawMessage.includes('blocked by policy') || rawMessage.includes('not permitted')) {
    return {
      title: t('public~Update blocked by cluster policy'),
      message: t(
        'public~Cluster policies or governance rules are blocking the update. Contact your cluster administrator for help resolving this issue.',
      ),
    };
  }

  // Pattern: Precondition failures (general)
  if (rawMessage.includes('Preconditions failed') || rawMessage.includes('Precondition')) {
    // Try to extract actionable advice (sentences that start with action words)
    const adviceMatch = rawMessage.match(/\.\s*(Please [^.]+\.)/);
    const advice = adviceMatch ? adviceMatch[1] : '';

    return {
      title: t('public~Update preconditions not met'),
      message:
        advice ||
        t(
          'public~The cluster does not meet the required conditions for updating. Check your cluster status and resolve any blocking issues.',
        ),
    };
  }

  // Pattern: Signatures/verification failures
  if (rawMessage.includes('signature') || rawMessage.includes('verification failed')) {
    return {
      title: t('public~Update signature verification failed'),
      message: t(
        'public~The update payload could not be verified. This might indicate issues with release signatures or registry certificates.',
      ),
    };
  }

  // Check for broader operator issues (matching troubleshoot conditions)
  if (cv && clusterOperators) {
    const conditions = cv.status?.conditions || [];

    // Check for cluster-level failure conditions
    const failing = conditions.find((c) => c.type === 'Failing' && c.status === 'True');
    const invalid = conditions.find((c) => c.type === 'Invalid' && c.status === 'True');
    const retrievedUpdates = conditions.find(
      (c) => c.type === 'RetrievedUpdates' && c.status === 'False',
    );
    const releaseAccepted = conditions.find(
      (c) => c.type === 'ReleaseAccepted' && c.status === 'False',
    );

    // Check for operator issues using same logic as troubleshoot conditions
    const operatorIssueDetails = detectOperatorIssues(clusterOperators);

    // If we have operator issues, show appropriate banner with details
    if (operatorIssueDetails.length > 0) {
      const operatorList = operatorIssueDetails
        .map((detail) => `${detail.name} (${detail.issue})`)
        .join(', ');

      const baseMessage = t(
        'public~{{count}} cluster operators are experiencing issues and need to be healthy before the cluster can be updated.',
        { count: operatorIssueDetails.length },
      );

      return {
        title: t('public~Cluster operators are experiencing issues'),
        message: t(
          'public~{{baseMessage}}\n\nAffected operators: {{operators}}\n\nCheck the operator status and ensure they have sufficient resources and network connectivity.',
          { baseMessage, operators: operatorList },
        ),
      };
    }

    // If we have other failure conditions (no operator issues but other problems)
    const hasOtherFailures =
      failing ||
      invalid ||
      (retrievedUpdates && retrievedUpdates.message) ||
      (releaseAccepted && releaseAccepted.message);

    if (hasOtherFailures) {
      return {
        title: t('public~Cluster update conditions need attention'),
        message: t(
          'public~The cluster has conditions that prevent updates. Check your cluster status and resolve any issues before you try to update.',
        ),
      };
    }
  }

  // Default: try to extract meaningful parts from technical messages
  if (rawMessage.length > 200) {
    // For very long technical messages, try to extract the last sentence which often contains actionable advice
    const sentences = rawMessage.split(/[.!?]+/).filter((s) => s.trim());
    const lastSentence = sentences[sentences.length - 1]?.trim();

    if (
      lastSentence &&
      (lastSentence.includes('Please ') ||
        lastSentence.includes('remove ') ||
        lastSentence.includes('Check '))
    ) {
      return {
        title: t('public~Update failed'),
        message: `${lastSentence}.`,
      };
    }
  }

  // Fallback: return cleaned up original message
  const cleanMessage = rawMessage
    .replace(/Preconditions failed for payload loaded version="[^"]*" image="[^"]*":\s*/, '') // Remove technical payload info
    .replace(/Precondition "[^"]*" failed because of "[^"]*":\s*/, '') // Remove precondition technical details
    .replace(/sha256:[a-f0-9]{64}/g, '[image digest]') // Replace long SHA digests
    .trim();

  return {
    title: t('public~Update failed'),
    message: cleanMessage || t('public~The cluster update could not be completed.'),
  };
};

export const ClusterNotUpgradeableAlert: FC<ClusterNotUpgradeableAlertProps> = ({
  cv,
  onCancel,
}) => {
  const [clusterOperators] = useK8sWatchResource<ClusterOperator[]>(ClusterOperatorsResource);
  const [clusterServiceVersions] = useK8sWatchResource<ClusterServiceVersionKind[]>(
    ClusterServiceVersionResource,
  );
  const { t } = useTranslation('public');
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
              'Your cluster cannot be updated to {{nextMajorMinorVersion}}. You can continue to install patch releases in {{currentMajorMinorVersion}}.',
              { nextMajorMinorVersion, currentMajorMinorVersion },
            )
          : t('Your cluster cannot be updated to the next minor version.')
      }
      className="co-alert"
      actionLinks={
        (notUpgradeableClusterOperatorsPresent || notUpgradeableCSVsPresent) && (
          <Flex>
            {notUpgradeableClusterOperatorsPresent && (
              <FlexItem>
                <ClusterOperatorsLink onCancel={onCancel} queryString="?status=Cannot+update">
                  {t('View ClusterOperators')}
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
                  {t('View installed Operators')}
                </Link>
              </FlexItem>
            )}
          </Flex>
        )
      }
      data-test="cluster-settings-alerts-not-upgradeable"
    >
      <MarkdownView content={clusterUpgradeableFalseCondition.message} inline />
    </Alert>
  );
};

export const MachineConfigPoolsArePausedAlert: FC<MachineConfigPoolsArePausedAlertProps> = ({
  machineConfigPools,
}) => {
  const { t } = useTranslation('public');
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
      title={t('{{resource}} updates are paused.', {
        resource: NodeModel.label,
      })}
      customIcon={<RhUiPauseCircleIcon />}
      actionLinks={
        workerMachineConfigPoolIsEditable && (
          <AlertActionLink
            onClick={() => Promise.all(getMCPsToPausePromises(pausedMCPs, false))}
            data-test="cluster-settings-alerts-paused-nodes-resume-link"
          >
            {t('Resume all updates')}
          </AlertActionLink>
        )
      }
      className="co-alert"
      data-test="cluster-settings-alerts-paused-nodes"
    />
  ) : null;
};

// Alert content component for cluster update status
interface AlertContentProps {
  failingCondition: boolean;
  progressingCondition: boolean;
  hasOperatorProblems: boolean;
  retrievedUpdatesFailure: boolean;
  message: string;
  rawFailureMessage?: string;
  operatorDetails?: string;
  currentVersion: string;
  desiredVersion: string;
  showPreCheck: boolean;
  cv: ClusterVersionKind;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const UpdateAlertContent: FC<AlertContentProps> = ({
  failingCondition,
  progressingCondition,
  hasOperatorProblems,
  retrievedUpdatesFailure,
  message,
  rawFailureMessage,
  operatorDetails,
  currentVersion,
  desiredVersion,
  showPreCheck,
  cv,
  t,
}) => {
  // Unified blocking condition predicate that covers all blocking states
  // This ensures title and body rendering stay in sync
  const isBlockingCondition =
    !!failingCondition || hasOperatorProblems || retrievedUpdatesFailure || rawFailureMessage;
  const isProgressing = !!progressingCondition;

  // Memoize expensive operations
  const hasUpdates = useMemo(() => hasAvailableUpdates(cv), [cv]);
  const availableUpdates = useMemo(() => getSortedAvailableUpdates(cv), [cv]);

  const updatesDisplayText = useMemo(() => {
    if (!hasUpdates) {
      return t('public~Cluster {{currentVersion}} - Up to Date', { currentVersion });
    }

    if (availableUpdates.length === 1) {
      return t('public~Update Available: {{updateVersion}}', {
        currentVersion,
        updateVersion: availableUpdates[0]?.version,
      });
    }

    if (availableUpdates.length > 1) {
      return t('public~Available Updates (latest: {{latestVersion}})', {
        currentVersion,
        latestVersion: availableUpdates[0]?.version,
      });
    }
    return '';
  }, [hasUpdates, availableUpdates, currentVersion, t]);

  if (isBlockingCondition && message) {
    return (
      <Stack hasGutter>
        <StackItem>
          <Label color="red" isCompact>
            {t('public~Issue detected')}
          </Label>
        </StackItem>
        <StackItem>
          <div>{message}</div>
        </StackItem>
        {(operatorDetails || (rawFailureMessage && rawFailureMessage !== message)) && (
          <StackItem>
            <details className="pf-v6-u-mt-sm">
              <summary className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                {t('public~View technical details')}
              </summary>
              <div className="pf-v6-u-mt-xs pf-v6-u-font-size-sm pf-v6-u-font-family-monospace">
                <MarkdownView content={operatorDetails || rawFailureMessage} inline />
              </div>
            </details>
          </StackItem>
        )}
      </Stack>
    );
  }

  if (isProgressing) {
    return (
      <Stack hasGutter>
        <StackItem>
          <Flex
            spaceItems={{ default: 'spaceItemsSm' }}
            alignItems={{ default: 'alignItemsCenter' }}
          >
            <FlexItem>
              <Label color="blue" isCompact icon={<RhUiInProgressIcon />}>
                {t('public~Updating')}
              </Label>
            </FlexItem>
            {currentVersion !== desiredVersion && (
              <>
                <FlexItem className="pf-v6-u-font-size-sm pf-v6-u-color-200">
                  {currentVersion}
                </FlexItem>
                <FlexItem className="pf-v6-u-font-size-sm pf-v6-u-color-200">→</FlexItem>
                <FlexItem className="pf-v6-u-font-size-sm pf-v6-u-font-weight-bold">
                  {desiredVersion}
                </FlexItem>
              </>
            )}
          </Flex>
        </StackItem>
        <StackItem>
          <div className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
            {currentVersion !== desiredVersion
              ? t('public~Cluster is updating to {{desiredVersion}}', { desiredVersion })
              : t('public~Cluster update is in progress')}
          </div>
        </StackItem>
      </Stack>
    );
  }

  if (showPreCheck) {
    return (
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
        <FlexItem>
          <Flex
            spaceItems={{ default: 'spaceItemsSm' }}
            alignItems={{ default: 'alignItemsCenter' }}
          >
            {hasUpdates && availableUpdates.length > 0 && (
              <FlexItem>
                <Label color="green" isCompact>
                  {availableUpdates.length === 1
                    ? t('public~1 update available')
                    : t('public~{{count}} updates available', { count: availableUpdates.length })}
                </Label>
              </FlexItem>
            )}
          </Flex>
        </FlexItem>
        <FlexItem>
          <div>{updatesDisplayText}</div>
        </FlexItem>
        <FlexItem>
          <div className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
            {hasUpdates
              ? t('public~Check cluster health and update prerequisites')
              : t('public~Verify cluster health and operational status')}
          </div>
        </FlexItem>
      </Flex>
    );
  }

  return (
    <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
      <FlexItem>
        <div>
          {updatesDisplayText || t('public~Cluster {{currentVersion}}', { currentVersion })}
        </div>
      </FlexItem>
      <FlexItem>
        <div className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
          {t('public~Review cluster status')}
        </div>
      </FlexItem>
    </Flex>
  );
};

const UpdateAssessmentCard: FC<{
  cv: ClusterVersionKind;
  clusterOperators?: ClusterOperator[];
  machineConfigPools?: MachineConfigPoolKind[];
}> = ({ cv, clusterOperators, machineConfigPools }) => {
  const { t } = useTranslation('public');
  const isOLSAvailable = useFlag(FEATURE_FLAG_LIGHTSPEED_PLUGIN);
  const [assessmentExpanded, setAssessmentExpanded] = useState(true);

  // Memoize expensive computations (call all hooks before any returns)
  const conditions = useMemo(() => cv.status?.conditions || [], [cv.status?.conditions]);
  const currentVersion = useMemo(() => getLastCompletedUpdate(cv), [cv]);
  const desiredVersion = useMemo(() => getDesiredClusterVersion(cv), [cv]);

  // Check cluster and operator conditions for alert display
  const progressingCondition = useMemo(
    () => conditions.find((c) => c.type === 'Progressing' && c.status === 'True'),
    [conditions],
  );
  const failingCondition = useMemo(
    () => conditions.find((c) => c.type === 'Failing' && c.status === 'True'),
    [conditions],
  );
  const hasOperatorProblems = useMemo(() => hasOperatorIssues(clusterOperators), [
    clusterOperators,
  ]);

  // Determine button visibility using the new unified logic
  const { showStatus, showPreCheck } = useMemo(
    () => determineWorkflowButtons(cv, clusterOperators),
    [cv, clusterOperators],
  );

  // Get failure details for display when issues exist
  const upgradeableCondition = useMemo(
    () => getConditionOfType(cv, ClusterVersionConditionType.Upgradeable),
    [cv],
  );
  const releaseAccepted = useMemo(
    () => getConditionOfType(cv, ClusterVersionConditionType.ReleaseAccepted),
    [cv],
  );
  const retrievedUpdates = useMemo(
    () => getConditionOfType(cv, ClusterVersionConditionType.RetrievedUpdates),
    [cv],
  );
  const invalid = useMemo(() => getConditionOfType(cv, ClusterVersionConditionType.Invalid), [cv]);

  const rawFailureMessage = useMemo(
    () =>
      failingCondition?.message ||
      // Only use Upgradeable message when status is False (not upgradeable)
      (upgradeableCondition?.status === 'False' ? upgradeableCondition.message : '') ||
      // Only use ReleaseAccepted message when status is False (not accepted)
      (releaseAccepted?.status === 'False' ? releaseAccepted.message : '') ||
      // Only use RetrievedUpdates message when status is False (failed to retrieve)
      (retrievedUpdates?.status === 'False' ? retrievedUpdates.message : '') ||
      // Only use Invalid message when status is True (cluster version is invalid)
      (invalid?.status === 'True' ? invalid.message : '') ||
      '',
    [failingCondition?.message, upgradeableCondition, releaseAccepted, retrievedUpdates, invalid],
  );

  const { message, operatorDetails } = useMemo(
    () => parseUpdateFailureMessage(rawFailureMessage, t, cv, clusterOperators),
    [rawFailureMessage, t, cv, clusterOperators],
  );

  // Memoize alert title determination
  const alertTitle = useMemo(() => {
    const hasFailures = !!failingCondition || hasOperatorProblems;
    const isProgressing = !!progressingCondition;

    if (hasFailures && isProgressing) {
      return t('public~Update issues detected');
    }
    if (hasFailures) {
      return t('public~Cluster issues detected');
    }
    if (isProgressing) {
      return t('public~Cluster updating');
    }
    if (showPreCheck) {
      return t('public~Cluster health');
    }
    return t('public~Cluster status');
  }, [failingCondition, hasOperatorProblems, progressingCondition, showPreCheck, t]);

  // Don't render if OLS is not available
  if (!isOLSAvailable) {
    return null;
  }

  // Don't render if no buttons should show
  if (!showPreCheck && !showStatus) {
    return null;
  }

  return (
    <Card
      isExpanded={assessmentExpanded}
      data-test="cluster-settings-update-assessment-box"
      className="pf-v6-u-mb-lg pf-v6-u-border-color-info pf-v6-u-border-width-sm"
    >
      <CardHeader
        onExpand={() => setAssessmentExpanded(!assessmentExpanded)}
        toggleButtonProps={{
          id: 'update-assessment-toggle',
          'aria-expanded': assessmentExpanded,
        }}
      >
        <CardTitle>{t('public~AI Assessment')}</CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>
          <Alert
            variant="info"
            customIcon={<RhUiInProgressIcon />}
            isInline
            title={alertTitle}
            actionLinks={
              isOLSAvailable && (showPreCheck || showStatus) ? (
                <Flex gap={{ default: 'gapLg' }} alignItems={{ default: 'alignItemsFlexStart' }}>
                  {/* Pre-check button: appears when cluster is healthy and ready for updates */}
                  {showPreCheck ? (
                    <UpdateWorkflowOLSButton
                      phase="pre-check"
                      cv={cv}
                      clusterOperators={clusterOperators}
                      machineConfigPools={machineConfigPools}
                      variant="primary"
                    />
                  ) : null}
                  {/* Status button: appears when cluster is progressing or has issues */}
                  {showStatus ? (
                    <UpdateWorkflowOLSButton
                      phase="status"
                      cv={cv}
                      clusterOperators={clusterOperators}
                      machineConfigPools={machineConfigPools}
                      variant="primary"
                    />
                  ) : null}
                </Flex>
              ) : null
            }
          >
            <UpdateAlertContent
              failingCondition={!!failingCondition}
              progressingCondition={!!progressingCondition}
              hasOperatorProblems={hasOperatorProblems}
              retrievedUpdatesFailure={!!retrievedUpdates && retrievedUpdates.status === 'False'}
              message={message}
              rawFailureMessage={rawFailureMessage}
              operatorDetails={operatorDetails}
              currentVersion={currentVersion}
              desiredVersion={desiredVersion}
              showPreCheck={showPreCheck}
              cv={cv}
              t={t}
            />
          </Alert>
          <Alert
            variant="warning"
            isInline
            isPlain
            title={t(
              'public~Cluster updates are irreversible. Once an update begins, it cannot be rolled back to the previous version.',
            )}
            className="pf-v6-u-mt-sm"
            data-test="update-assessment-irreversibility-notice"
          />
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
};

const ClusterSettingsAlerts: FC<ClusterSettingsAlertsProps> = ({ cv, machineConfigPools }) => {
  const { t } = useTranslation('public');
  const isOLSAvailable = useFlag(FEATURE_FLAG_LIGHTSPEED_PLUGIN);

  // Gate cluster operator watching behind OLS availability to prevent unnecessary API calls
  const [clusterOperators] = useK8sWatchResource<ClusterOperator[]>(
    isOLSAvailable ? ClusterOperatorsResource : null,
  );

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
      <UpdateAssessmentCard
        cv={cv}
        clusterOperators={clusterOperators}
        machineConfigPools={machineConfigPools}
      />
    </>
  );
};

const ClusterVersionDetailsTable: FC<ClusterVersionDetailsTableProps> = ({
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

  const { t } = useTranslation('public');
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
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </div>
              <div className="co-cluster-settings__section">
                <div className="co-cluster-settings__row">
                  <DescriptionList className="co-cluster-settings__details co-cluster-settings__details--status">
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Update status')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        <UpdateStatus cv={cv} />
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
                        title={t('Click "Select a version" to view versions with known issues.')}
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
                  </>
                )}
              </div>
            </div>
          </div>
        </PaneBodyGroup>
        <DescriptionList>
          {window.SERVER_FLAGS.branding !== 'okd' && window.SERVER_FLAGS.branding !== 'azure' && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Subscription')}</DescriptionListTerm>
              <DescriptionListDescription>
                <ExternalLink text={t('OpenShift Cluster Manager')} href={getOCMLink(clusterID)} />.
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
            <DescriptionListTerm>{t('Cluster ID')}</DescriptionListTerm>
            <DescriptionListDescription
              className="co-break-all co-select-to-copy"
              data-test-id="cv-details-table-cid"
            >
              {clusterID}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Desired release image')}</DescriptionListTerm>
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
            <DescriptionListTerm>{t('Cluster version configuration')}</DescriptionListTerm>
            <DescriptionListDescription>
              <ResourceLink
                groupVersionKind={getGroupVersionKindForModel(ClusterVersionModel)}
                name={cv.metadata.name}
              />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <UpstreamConfigDetailsItem resource={cv} />
          {autoscalers && canUpgrade && (
            <DescriptionListGroup>
              <DescriptionListTerm data-test="cv-autoscaler">
                {t('Cluster autoscaler')}
              </DescriptionListTerm>
              <DescriptionListDescription>
                {_.isEmpty(autoscalers) ? (
                  <Link to={`${resourcePathFromModel(ClusterAutoscalerModel)}/~new`}>
                    <RhUiAddCircleIcon className="co-icon-space-r" />
                    {t('Create autoscaler')}
                  </Link>
                ) : (
                  autoscalers.map((autoscaler) => (
                    <div key={autoscaler.metadata.uid}>
                      <ResourceLink
                        groupVersionKind={getGroupVersionKindForModel(ClusterAutoscalerModel)}
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
        <SectionHeading text={t('Update history')} />
        {_.isEmpty(history) ? (
          <EmptyBox label={t('History')} />
        ) : (
          <>
            <Content>
              <Content component={ContentVariants.p} className="help-block pf-v6-u-mb-lg">
                {t(
                  'There is a threshold for rendering update data which may cause gaps in the information below.',
                )}
              </Content>
            </Content>
            <div className="co-table-container">
              <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
                <thead className="pf-v6-c-table__thead">
                  <tr className="pf-v6-c-table__tr">
                    <th className="pf-v6-c-table__th">{t('Version')}</th>
                    <th className="pf-v6-c-table__th">{t('State')}</th>
                    <th className="pf-v6-c-table__th">{t('Started')}</th>
                    <th className="pf-v6-c-table__th">{t('Completed')}</th>
                    {releaseNotes && (
                      <th className="pf-v6-c-table__th pf-m-hidden pf-m-visible-on-md">
                        {t('Release notes')}
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

const ClusterOperatorTabPage: FC<ClusterOperatorTabPageProps> = ({ obj: cv }) => (
  <ClusterOperatorPage cv={cv} autoFocus={false} showTitle={false} />
);

export const ClusterSettingsPage: FC = () => {
  const { t } = useTranslation('public');
  const hasClusterAutoscaler = useFlag(FLAGS.CLUSTER_AUTOSCALER);
  const title = t('Cluster Settings');

  const [objData, objLoaded, objLoadError] = useK8sWatchResource<ClusterVersionKind>({
    kind: clusterVersionReference,
    name: 'version',
  });

  const [autoscalersData, autoscalersLoaded, autoscalersLoadError] = useK8sWatchResource<
    K8sResourceKind[]
  >(
    hasClusterAutoscaler
      ? {
          kind: clusterAutoscalerReference,
          isList: true,
        }
      : null,
  );

  const resourceKeys = hasClusterAutoscaler ? ['obj', 'autoscalers'] : ['obj'];
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

  const loaded = hasClusterAutoscaler ? objLoaded && autoscalersLoaded : objLoaded;
  const loadError = objLoadError || autoscalersLoadError;

  const horizontalNavProps = {
    pages,
    resourceKeys,
    obj: { data: objData, loaded: objLoaded },
    ...(hasClusterAutoscaler && {
      autoscalers: { data: autoscalersData, loaded: autoscalersLoaded },
    }),
    loaded,
    loadError,
  };

  return (
    <PageTitleContext.Provider value={titleProviderValues}>
      <PageHeading
        title={
          <div
            data-test-id="cluster-settings-page-heading"
            data-test="cluster-settings-page-heading"
          >
            {title}
          </div>
        }
      />
      <HorizontalNav {...horizontalNavProps} />
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
