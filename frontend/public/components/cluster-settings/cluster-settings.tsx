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
} from '@patternfly/react-core';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import {
  AddCircleOIcon,
  PauseCircleIcon,
  PencilAltIcon,
  InProgressIcon,
} from '@patternfly/react-icons';

import { UpdateWorkflowOLSButton } from './ols-update-workflows/explain-button';
import {
  hasAvailableUpdates,
  hasOperatorIssues,
  determineWorkflowButtons,
} from './ols-update-workflows/workflow-utils';

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
import { FLAGS } from '@console/shared/src/constants';

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
  const percentOperators = Math.round((updatedOperatorsCount / totalOperatorsCount) * 100);
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

// Helper function to get a condition by type from cluster version
const getConditionOfType = (cv: ClusterVersionKind, type: ClusterVersionConditionType) =>
  cv.status?.conditions?.find((c) => c.type === type);

// Helper function to parse and improve error messages for better user experience
const parseUpdateFailureMessage = (
  rawMessage: string,
  t: (key: string, options?: { [key: string]: string | number }) => string,
  cv?: ClusterVersionKind,
  clusterOperators?: ClusterOperator[],
): { title: string; message: string } => {
  if (!rawMessage) {
    return {
      title: t('public~Update failed with unknown error'),
      message: t('public~An unexpected error occurred during the update process.'),
    };
  }

  // Pattern: ClusterVersionOverridesSet
  if (rawMessage.includes('ClusterVersionOverridesSet')) {
    return {
      title: t('public~Update blocked by cluster version overrides'),
      message: t(
        'public~The cluster has version overrides configured that prevent automatic updates. Remove the overrides from the ClusterVersion object to continue with the update.',
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
        'public~Some cluster operators are in a degraded or unavailable state. Fix the operator issues before attempting to update the cluster.',
      ),
    };
  }

  // Pattern: Validation failures
  if (rawMessage.includes('validation failed') || rawMessage.includes('Validation error')) {
    return {
      title: t('public~Update validation failed'),
      message: t(
        'public~The update payload failed validation checks. This may indicate issues with the update manifest or cluster configuration.',
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
        'public~Unable to download or validate the update payload. Check network connectivity and registry access.',
      ),
    };
  }

  // Pattern: Insufficient resources
  if (rawMessage.includes('insufficient resources') || rawMessage.includes('out of disk space')) {
    return {
      title: t('public~Update failed due to insufficient resources'),
      message: t(
        'public~The cluster does not have enough resources to complete the update. Ensure adequate disk space and memory are available.',
      ),
    };
  }

  // Pattern: Update blocked by policy
  if (rawMessage.includes('blocked by policy') || rawMessage.includes('not permitted')) {
    return {
      title: t('public~Update blocked by cluster policy'),
      message: t(
        'public~The update is blocked by cluster policies or governance rules. Contact your cluster administrator for assistance.',
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
          'public~The cluster does not meet the required conditions for updating. Check the cluster status and resolve any blocking issues.',
        ),
    };
  }

  // Pattern: Signatures/verification failures
  if (rawMessage.includes('signature') || rawMessage.includes('verification failed')) {
    return {
      title: t('public~Update signature verification failed'),
      message: t(
        'public~The update payload could not be verified. This may indicate issues with release signatures or registry certificates.',
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
    const operatorIssueDetails = clusterOperators
      .map((operator) => {
        const operatorConditions = operator.status?.conditions || [];
        const degraded = operatorConditions.find(
          (c) => c.type === 'Degraded' && c.status === 'True',
        );
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
        message: `${baseMessage}\n\nAffected operators: ${operatorList}\n\nCheck the operator status and ensure they have sufficient resources and network connectivity.`,
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
          'public~The cluster has conditions that prevent updates. Check the cluster status and resolve any issues before attempting to update.',
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
    message: cleanMessage || t('public~An error occurred during the update process.'),
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
      <MarkdownView content={clusterUpgradeableFalseCondition.message} inline />
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

// Alert content component for cluster update status
interface AlertContentProps {
  failingCondition: boolean;
  progressingCondition: boolean;
  hasOperatorProblems: boolean;
  message: string;
  rawFailureMessage?: string;
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
  message,
  rawFailureMessage,
  currentVersion,
  desiredVersion,
  showPreCheck,
  cv,
  t,
}) => {
  const hasFailures = !!failingCondition || hasOperatorProblems;
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

  if (hasFailures && message) {
    return (
      <>
        <div>{message}</div>
        {rawFailureMessage && rawFailureMessage !== message && (
          <details className="pf-v6-u-mt-sm">
            <summary className="pf-v6-u-font-size-sm pf-v6-u-color-200">
              {t('public~View technical details')}
            </summary>
            <div className="pf-v6-u-mt-xs pf-v6-u-font-size-sm pf-v6-u-font-family-monospace">
              <MarkdownView content={rawFailureMessage} inline />
            </div>
          </details>
        )}
      </>
    );
  }

  if (isProgressing) {
    return (
      <>
        <div>
          {currentVersion !== desiredVersion
            ? t('public~Updating from {{currentVersion}} to {{desiredVersion}}', {
                currentVersion,
                desiredVersion,
              })
            : t('public~Update is in progress')}
        </div>
        <div className="pf-v6-u-mt-sm pf-v6-u-color-200 pf-v6-u-font-size-sm">
          {t('public~Need help understanding the progress?')}
        </div>
      </>
    );
  }

  if (showPreCheck) {
    return (
      <>
        <div>{updatesDisplayText}</div>
        <div className="pf-v6-u-mt-sm pf-v6-u-color-200 pf-v6-u-font-size-sm">
          {hasUpdates
            ? t('public~Check cluster health and update prerequisites.')
            : t('public~Verify cluster health and operational status.')}
        </div>
      </>
    );
  }

  return null;
};

export const UpdateAssessmentCard: FC<{
  cv: ClusterVersionKind;
  clusterOperators?: ClusterOperator[];
}> = ({ cv, clusterOperators }) => {
  const { t } = useTranslation();
  const isOLSAvailable = useFlag('LIGHTSPEED_CONSOLE');
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
      releaseAccepted?.message ||
      retrievedUpdates?.message ||
      invalid?.message ||
      '',
    [
      failingCondition?.message,
      releaseAccepted?.message,
      retrievedUpdates?.message,
      invalid?.message,
    ],
  );

  const { message } = useMemo(
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
            customIcon={<InProgressIcon />}
            isInline
            title={alertTitle}
            className="pf-v6-u-background-color-purple-100 pf-v6-u-border-color-purple-200"
            actionLinks={
              (showPreCheck || showStatus) && (
                <div className="pf-v6-u-display-flex pf-v6-u-flex-direction-row pf-v6-u-gap-lg pf-v6-u-align-items-flex-start">
                  {/* Pre-check button: appears when cluster is healthy and ready for updates */}
                  {showPreCheck && (
                    <UpdateWorkflowOLSButton
                      phase="pre-check"
                      cv={cv}
                      clusterOperators={clusterOperators}
                      variant="primary"
                      className="pf-v6-u-font-weight-normal"
                    />
                  )}
                  {/* Status button: appears when cluster is progressing or has issues */}
                  {showStatus && (
                    <UpdateWorkflowOLSButton
                      phase="status"
                      cv={cv}
                      clusterOperators={clusterOperators}
                      variant="primary"
                      className="pf-v6-u-font-weight-normal"
                    />
                  )}
                </div>
              )
            }
          >
            <UpdateAlertContent
              failingCondition={!!failingCondition}
              progressingCondition={!!progressingCondition}
              hasOperatorProblems={hasOperatorProblems}
              message={message}
              rawFailureMessage={rawFailureMessage}
              currentVersion={currentVersion}
              desiredVersion={desiredVersion}
              showPreCheck={showPreCheck}
              cv={cv}
              t={t}
            />
          </Alert>
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
};

export const PreCheckCard: FC<{ cv: ClusterVersionKind }> = ({ cv }) => {
  const { t } = useTranslation();
  const isOLSAvailable = useFlag('LIGHTSPEED_CONSOLE');
  const [preCheckExpanded, setPreCheckExpanded] = useState(true);

  // Memoize expensive computations (call all hooks before any returns)
  const currentVersion = useMemo(() => getLastCompletedUpdate(cv), [cv]);
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

  // Don't render if OLS is not available
  if (!isOLSAvailable) {
    return null;
  }

  return (
    <Card
      isExpanded={preCheckExpanded}
      data-test="cluster-settings-precheck-box"
      className="pf-v6-u-mb-lg pf-v6-u-border-color-success pf-v6-u-border-width-sm"
    >
      <CardHeader
        onExpand={() => setPreCheckExpanded(!preCheckExpanded)}
        toggleButtonProps={{
          id: 'precheck-toggle',
          'aria-expanded': preCheckExpanded,
        }}
      >
        <CardTitle>{t('public~AI Assessment')}</CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>
          <Alert
            variant="info"
            isInline
            title={t('public~Cluster Health Analysis')}
            className="pf-v6-u-background-color-purple-100 pf-v6-u-border-color-purple-200"
          >
            <div>{updatesDisplayText}</div>
            <div className="pf-v6-u-mt-sm pf-v6-u-color-200 pf-v6-u-font-size-sm">
              {hasUpdates
                ? t('public~Check cluster health and update prerequisites.')
                : t('public~Verify cluster health and operational status.')}
            </div>
          </Alert>
          <UpdateWorkflowOLSButton
            phase="pre-check"
            cv={cv}
            className="pf-v6-u-mt-md pf-v6-u-font-weight-normal"
            variant="primary"
          />
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
};

export const ClusterSettingsAlerts: FC<ClusterSettingsAlertsProps> = ({
  cv,
  machineConfigPools,
}) => {
  const { t } = useTranslation();
  const isOLSAvailable = useFlag('LIGHTSPEED_CONSOLE');

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
      <UpdateAssessmentCard cv={cv} clusterOperators={clusterOperators} />
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
                <ExternalLink href={getOCMLink(clusterID)}>
                  {t('public~OpenShift Cluster Manager')}
                </ExternalLink>
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
      <PageHeading title={<div data-test-id="cluster-settings-page-heading">{title}</div>} />
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
