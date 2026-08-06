import type { FC, ReactNode } from 'react';
import { Alert, Flex, FlexItem, Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import * as semver from 'semver';
import type { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { MarkdownView } from '@console/shared/src/components/markdown/MarkdownView';
import { ClusterOperatorModel } from '../../models';
import type { ClusterOperator, ClusterVersionKind } from '../../module/k8s';
import {
  getConditionUpgradeableFalse,
  getLastCompletedUpdate,
  getNewerMinorVersionUpdate,
  getNotUpgradeableResources,
  getSortedAvailableUpdates,
  referenceForModel,
} from '../../module/k8s';
import { documentationURLs, getDocumentationURL } from '../utils/documentation';

const ClusterOperatorsResource: WatchK8sResource = {
  isList: true,
  kind: referenceForModel(ClusterOperatorModel),
};

const ClusterServiceVersionResource: WatchK8sResource = {
  isList: true,
  kind: referenceForModel(ClusterServiceVersionModel),
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

export const ChannelDocLink: FC<{}> = () => {
  const upgradeURL = getDocumentationURL(documentationURLs.understandingUpgradeChannels);
  const { t } = useTranslation('public');
  return <ExternalLink href={upgradeURL} text={t('Learn more about OpenShift update channels')} />;
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
              'Your cluster cannot update to {{nextMajorMinorVersion}}. You can continue to install patch releases in {{currentMajorMinorVersion}}.',
              { nextMajorMinorVersion, currentMajorMinorVersion },
            )
          : t('Your cluster cannot update to the next minor version.')
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

type ClusterOperatorsLinkProps = {
  children: ReactNode;
  onCancel?: () => void;
  queryString?: string;
};

type ClusterNotUpgradeableAlertProps = {
  cv: ClusterVersionKind;
  onCancel?: () => void;
};
