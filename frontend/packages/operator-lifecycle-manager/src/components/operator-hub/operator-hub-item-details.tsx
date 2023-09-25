import * as React from 'react';
import { PropertiesSidePanel, PropertyItem } from '@patternfly/react-catalog-view-extension';
import {
  Alert,
  AlertActionCloseButton,
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import * as classNames from 'classnames';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  HintBlock,
  Timestamp,
  getQueryArgument,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  CloudCredentialKind,
  InfrastructureKind,
  AuthenticationKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { RH_OPERATOR_SUPPORT_POLICY_LINK, isClusterExternallyManaged } from '@console/shared';
import { DefaultCatalogSource } from '../../const';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionKind, SubscriptionKind } from '../../types';
import { MarkdownView } from '../clusterserviceversion';
import { defaultChannelNameFor } from '../index';
import { OperatorChannelSelect, OperatorVersionSelect } from './operator-channel-version-select';
import { shortLivedTokenAuth, isAWSSTSCluster } from './operator-hub-utils';
import { InfraFeatures, OperatorHubItem } from './index';

// t('olm~Basic Install'),
// t('olm~Seamless Upgrades'),
// t('olm~Full Lifecycle'),
// t('olm~Deep Insights'),
// t('olm~Auto Pilot'),
const levels = [
  'Basic Install',
  'Seamless Upgrades',
  'Full Lifecycle',
  'Deep Insights',
  'Auto Pilot',
];

const CapabilityLevel: React.FC<CapabilityLevelProps> = ({ selectedChannelCapabilityLevel }) => {
  const { t } = useTranslation();
  const capabilityLevelIndex = levels.indexOf(selectedChannelCapabilityLevel);

  return (
    <ul className="properties-side-panel-pf-property-value__capability-levels">
      {levels.map((level, i) => {
        const active = capabilityLevelIndex >= i;
        return (
          <li
            className={classNames('properties-side-panel-pf-property-value__capability-level', {
              'properties-side-panel-pf-property-value__capability-level--active': active,
            })}
            key={level}
          >
            {active && (
              <CheckCircleIcon
                color="var(--pf-global--primary-color--100)"
                className="properties-side-panel-pf-property-value__capability-level-icon"
                title={t('olm~Checked')}
              />
            )}
            {t(`olm~${level}`)}
          </li>
        );
      })}
    </ul>
  );
};

type CapabilityLevelProps = {
  selectedChannelCapabilityLevel: string;
};

const InstalledHintBlock: React.FC<OperatorHubItemDetailsHintBlockProps> = ({
  latestVersion,
  subscription,
  installedChannel,
}) => {
  const { t } = useTranslation();
  const [installedCSV] = useK8sWatchResource<ClusterServiceVersionKind>({
    kind: referenceForModel(ClusterServiceVersionModel),
    name: subscription?.status?.installedCSV,
    namespace: subscription?.metadata?.namespace,
    isList: false,
    namespaced: true,
  });
  const nsPath = `/k8s/ns/${subscription.metadata.namespace}`;
  const to = installedCSV
    ? `${nsPath}/clusterserviceversions/${installedCSV?.metadata?.name ?? ''}`
    : `${nsPath}/subscriptions/${subscription.metadata.name ?? ''}`;
  const installedVersion = installedCSV?.spec?.version;
  return (
    <HintBlock className="co-catalog-page__hint" title={t('olm~Installed Operator')}>
      <p>
        {t('olm~This Operator has been installed on the cluster.')}{' '}
        <Link to={to}>{t('olm~View it here.')}</Link>
      </p>
      {installedVersion !== latestVersion ? (
        <>
          <DescriptionList columnModifier={{ default: '2Col' }}>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('olm~Installed Channel')}</DescriptionListTerm>
              <DescriptionListDescription>{installedChannel}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('olm~Installed Version')}</DescriptionListTerm>
              <DescriptionListDescription>{installedVersion}</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </>
      ) : null}
    </HintBlock>
  );
};

const InstallingHintBlock: React.FC<OperatorHubItemDetailsHintBlockProps> = ({ subscription }) => {
  const { t } = useTranslation();
  const [installedCSV] = useK8sWatchResource<ClusterServiceVersionKind>(
    subscription?.status?.installedCSV
      ? {
          kind: referenceForModel(ClusterServiceVersionModel),
          name: subscription?.status?.installedCSV,
          namespace: subscription?.metadata?.namespace,
          isList: false,
          namespaced: true,
        }
      : null,
  );
  const nsPath = `/k8s/ns/${subscription.metadata.namespace}`;
  const to = installedCSV
    ? `${nsPath}/clusterserviceversions/${installedCSV?.metadata?.name}/subscription`
    : `${nsPath}/subscriptions/${subscription.metadata.name ?? ''}`;
  return (
    <HintBlock className="co-catalog-page__hint" title={t('olm~Installing Operator')}>
      <p>
        <span>
          <Trans ns="olm">This Operator is being installed on the cluster.</Trans>
        </span>
        &nbsp;
        <Link to={to}>{t('olm~View it here.')}</Link>
      </p>
    </HintBlock>
  );
};

const OperatorHubItemDetailsHintBlock: React.FC<OperatorHubItemDetailsHintBlockProps> = (props) => {
  const { t } = useTranslation();
  const { installed, isInstalling, catalogSource } = props;
  if (isInstalling) {
    return <InstallingHintBlock {...props} />;
  }

  if (installed) {
    return <InstalledHintBlock {...props} />;
  }

  if (catalogSource === DefaultCatalogSource.CommunityOperators) {
    return (
      <HintBlock className="co-catalog-page__hint" title={t('olm~Community Operator')}>
        <p>
          {t(
            'olm~This is a community provided Operator. These are Operators which have not been vetted or verified by Red Hat. Community Operators should be used with caution because their stability is unknown. Red Hat provides no support for community Operators.',
          )}
        </p>
        {RH_OPERATOR_SUPPORT_POLICY_LINK && (
          <span className="co-modal-ignore-warning__link">
            <ExternalLink
              href={RH_OPERATOR_SUPPORT_POLICY_LINK}
              text={t('olm~Learn more about Red Hat’s third party software support policy')}
            />
          </span>
        )}
      </HintBlock>
    );
  }

  if (catalogSource === DefaultCatalogSource.RedHatMarketPlace) {
    return (
      <HintBlock title={t('olm~Marketplace Operator')}>
        <p>
          {t(
            'olm~This Operator is purchased through Red Hat Marketplace. After completing the purchase process, you can install the Operator on this or other OpenShift clusters. Visit Red Hat Marketplace for more details and to track your usage of this application.',
          )}
        </p>
        <p>
          <ExternalLink
            href="https://marketplace.redhat.com/en-us?utm_source=openshift_console"
            text={t('olm~Learn more about the Red Hat Marketplace')}
          />
        </p>
      </HintBlock>
    );
  }

  return null;
};

export const OperatorHubItemDetails: React.FC<OperatorHubItemDetailsProps> = ({
  item,
  updateChannel,
  setUpdateChannel,
  updateVersion,
  setUpdateVersion,
}) => {
  const { t } = useTranslation();
  const {
    catalogSource,
    catalogSourceDisplayName,
    description,
    infraFeatures,
    installed,
    isInstalling,
    longDescription,
    marketplaceSupportWorkflow,
    obj,
    provider,
    repository,
    subscription,
    support,
    validSubscription,
    version,
    cloudCredentials,
    infrastructure,
    authentication,
  } = item;

  const installChannel = getQueryArgument('channel');
  const currentChannel = obj.status.channels.find((ch) => ch.name === installChannel);
  const selectedChannelContainerImage = currentChannel?.currentCSVDesc.annotations.containerImage;
  const selectedChannelCreatedAt = currentChannel?.currentCSVDesc.annotations.createdAt;
  const selectedChannelCapabilityLevel = currentChannel?.currentCSVDesc.annotations.capabilities;

  const installedChannel = item?.subscription?.spec?.channel;
  const notAvailable = (
    <span className="properties-side-panel-pf-property-label">{t('olm~N/A')}</span>
  );
  const created = Date.parse(selectedChannelCreatedAt) ? (
    <Timestamp timestamp={selectedChannelCreatedAt} />
  ) : (
    selectedChannelCreatedAt
  );

  const [showWarn, setShowWarn] = React.useState(true);
  const mappedData = (data) => data?.map?.((d) => <div key={d}>{d}</div>) ?? notAvailable;

  const mappedInfraFeatures = mappedData(infraFeatures);
  const mappedValidSubscription = mappedData(validSubscription);

  const supportWorkflowUrl = React.useMemo(() => {
    if (marketplaceSupportWorkflow) {
      try {
        const url = new URL(marketplaceSupportWorkflow);
        url.searchParams.set('utm_source', 'openshift_console');
        return url.toString();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error while setting utm_source to support workflow URL', error.message);
      }
    }
    return null;
  }, [marketplaceSupportWorkflow]);

  const selectedUpdateChannel = updateChannel || defaultChannelNameFor(obj);

  return item ? (
    <div className="modal-body modal-body-border">
      <div className="modal-body-content">
        <div className="modal-body-inner-shadow-covers">
          <div className="co-catalog-page__overlay-body">
            <PropertiesSidePanel>
              <PropertyItem
                label={t('olm~Channel')}
                value={
                  <OperatorChannelSelect
                    packageManifest={obj}
                    selectedUpdateChannel={selectedUpdateChannel}
                    setUpdateChannel={setUpdateChannel}
                    setUpdateVersion={setUpdateVersion}
                  />
                }
              />
              <PropertyItem
                label={t('olm~Version')}
                value={
                  <OperatorVersionSelect
                    packageManifest={obj}
                    selectedUpdateChannel={selectedUpdateChannel}
                    updateVersion={updateVersion}
                    setUpdateVersion={setUpdateVersion}
                  />
                }
              />
              <PropertyItem
                label={t('olm~Capability level')}
                value={
                  selectedChannelCapabilityLevel ? (
                    <CapabilityLevel
                      selectedChannelCapabilityLevel={selectedChannelCapabilityLevel}
                    />
                  ) : (
                    notAvailable
                  )
                }
              />
              <PropertyItem
                label={t('olm~Source')}
                value={catalogSourceDisplayName || notAvailable}
              />
              <PropertyItem label={t('olm~Provider')} value={provider || notAvailable} />
              {infraFeatures?.length > 0 && (
                <PropertyItem
                  label={t('olm~Infrastructure features')}
                  value={mappedInfraFeatures}
                />
              )}
              {validSubscription?.length > 0 && (
                <PropertyItem
                  label={t('olm~Valid Subscriptions')}
                  value={mappedValidSubscription}
                />
              )}
              <PropertyItem
                label={t('olm~Repository')}
                value={
                  repository ? <ExternalLink href={repository} text={repository} /> : notAvailable
                }
              />
              <PropertyItem
                label={t('olm~Container image')}
                value={
                  selectedChannelContainerImage ? (
                    <div className="co-break-all co-select-to-copy">
                      {selectedChannelContainerImage}
                    </div>
                  ) : (
                    notAvailable
                  )
                }
              />
              <PropertyItem label={t('olm~Created at')} value={created || notAvailable} />
              <PropertyItem
                label={t('olm~Support')}
                value={
                  supportWorkflowUrl ? (
                    <ExternalLink href={supportWorkflowUrl} text={t('olm~Get support')} />
                  ) : (
                    support || notAvailable
                  )
                }
              />
            </PropertiesSidePanel>
            <div className="co-catalog-page__overlay-description">
              {isAWSSTSCluster(cloudCredentials, infrastructure, authentication) &&
                showWarn &&
                !isClusterExternallyManaged() &&
                infraFeatures?.find((i) => i === InfraFeatures[shortLivedTokenAuth]) && (
                  <Alert
                    isInline
                    variant="warning"
                    title={t('olm~Cluster in STS Mode')}
                    actionClose={<AlertActionCloseButton onClose={() => setShowWarn(false)} />}
                    className="pf-u-mb-lg"
                  >
                    <p>
                      {t(
                        'olm~This cluster is using AWS Security Token Service to reach the cloud API. In order for this operator to take the actions it requires directly with the cloud API, you will need to provide a role ARN (with an attached policy) during installation. Please see the operator description for more details.',
                      )}
                    </p>
                  </Alert>
                )}
              <OperatorHubItemDetailsHintBlock
                installed={installed}
                isInstalling={isInstalling}
                latestVersion={version}
                catalogSource={catalogSource}
                subscription={subscription}
                installedChannel={installedChannel}
                cloudCredentials={cloudCredentials}
                authentication={authentication}
                infrastructure={infrastructure}
              />
              {longDescription ? <MarkdownView content={longDescription} /> : description}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

OperatorHubItemDetails.defaultProps = {
  item: null,
};
type OperatorHubItemDetailsHintBlockProps = {
  installed: boolean;
  isInstalling: boolean;
  latestVersion: string;
  catalogSource: string;
  subscription: SubscriptionKind;
  installedChannel: string;
  cloudCredentials: CloudCredentialKind;
  authentication: AuthenticationKind;
  infrastructure: InfrastructureKind;
};

export type OperatorHubItemDetailsProps = {
  item: OperatorHubItem;
  updateChannel: string;
  updateVersion: string;
  setUpdateChannel: (updateChannel: string) => void;
  setUpdateVersion: (updateVersion: string) => void;
};

OperatorHubItemDetails.displayName = 'OperatorHubItemDetails';
