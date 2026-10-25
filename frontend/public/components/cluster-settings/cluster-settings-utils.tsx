import type { FC, ReactNode } from 'react';
import { Alert, Flex, FlexItem, Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import * as semver from 'semver';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { MarkdownView } from '@console/shared/src/components/markdown/MarkdownView';
import type { ClusterVersionKind } from '../../module/k8s';
import {
  getConditionUpgradeableFalse,
  getLastCompletedUpdate,
  getNewerMinorVersionUpdate,
  getSortedAvailableUpdates,
} from '../../module/k8s';
import { documentationURLs, getDocumentationURL } from '../utils/documentation';
import { resourceListPathFromModel } from '../utils/resource-link';

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
  const { t } = useTranslation('public');
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
        <Flex>
          <FlexItem>
            <ClusterOperatorsLink onCancel={onCancel} queryString="?status=Cannot+update">
              {t('View ClusterOperators')}
            </ClusterOperatorsLink>
          </FlexItem>
          {/* TODO:  update link to include filter once installed Operators filters are updated */}
          <FlexItem>
            <Link onClick={onCancel} to={resourceListPathFromModel(ClusterServiceVersionModel)}>
              {t('View installed Operators')}
            </Link>
          </FlexItem>
        </Flex>
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
