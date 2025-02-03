import * as React from 'react';
import { PropertiesSidePanel, PropertyItem } from '@patternfly/react-catalog-view-extension';
import {
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
  Hint,
  HintTitle,
  HintBody,
  HintFooter,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { ExternalLink, Timestamp, getQueryArgument } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  CloudCredentialKind,
  InfrastructureKind,
  AuthenticationKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { RH_OPERATOR_SUPPORT_POLICY_LINK } from '@console/shared';
import { DefaultCatalogSource } from '../../const';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionKind, SubscriptionKind } from '../../types';
import { MarkdownView } from '../clusterserviceversion';
import { DeprecatedOperatorWarningAlert } from '../deprecated-operator-warnings/deprecated-operator-warnings';
import { useDeprecatedOperatorWarnings } from '../deprecated-operator-warnings/use-deprecated-operator-warnings';
import { defaultChannelNameFor } from '../index';
import { OperatorChannelSelect, OperatorVersionSelect } from './operator-channel-version-select';
import { CloudServiceTokenWarningAlert } from './operator-hub-subscribe';
import { isAWSSTSCluster, isAzureWIFCluster, isGCPWIFCluster } from './operator-hub-utils';
import { InfrastructureFeature, OperatorHubItem } from './index';

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

const OperatorHubItemCustomizedHint: React.FC<OperatorHubItemCustomizedHintProps> = ({
  title,
  body,
  footer,
}) => {
  return (
    <Hint className="pf-v6-u-mb-sm">
      <HintTitle className="pf-v6-u-font-size-md">{title}</HintTitle>
      <HintBody>{body}</HintBody>
      <HintFooter>{footer}</HintFooter>
    </Hint>
  );
};

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
                color="var(--pf-t--global--icon--color--brand--default)"
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

const InstalledHint: React.FC<OperatorHubItemDetailsHintProps> = ({
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
    <OperatorHubItemCustomizedHint
      title={t('olm~Installed Operator')}
      body={
        <>
          {t('olm~This Operator has been installed on the cluster.')}{' '}
          <Link to={to}>{t('olm~View it here.')}</Link>
        </>
      }
      footer={
        installedVersion !== latestVersion ? (
          <HintFooter>
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
          </HintFooter>
        ) : null
      }
    />
  );
};

const InstallingHint: React.FC<OperatorHubItemDetailsHintProps> = ({ subscription }) => {
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
    <OperatorHubItemCustomizedHint
      title={t('olm~Installing Operator')}
      body={t(
        'olm~This is a community provided Operator. These are Operators which have not been vetted or verified by Red Hat. Community Operators should be used with caution because their stability is unknown. Red Hat provides no support for community Operators.',
      )}
      footer={
        <>
          <span>
            <Trans ns="olm">This Operator is being installed on the cluster.</Trans>
          </span>
          &nbsp;
          <Link to={to}>{t('olm~View it here.')}</Link>
        </>
      }
    />
  );
};

const OperatorHubItemDetailsHint: React.FC<OperatorHubItemDetailsHintProps> = (props) => {
  const { t } = useTranslation();
  const { installed, isInstalling, catalogSource } = props;
  if (isInstalling) {
    return <InstallingHint {...props} />;
  }

  if (installed) {
    return <InstalledHint {...props} />;
  }

  if (catalogSource === DefaultCatalogSource.CommunityOperators) {
    return (
      <OperatorHubItemCustomizedHint
        title={t('olm~Community Operator')}
        body={t(
          'olm~This is a community provided Operator. These are Operators which have not been vetted or verified by Red Hat. Community Operators should be used with caution because their stability is unknown. Red Hat provides no support for community Operators.',
        )}
        footer={
          RH_OPERATOR_SUPPORT_POLICY_LINK && (
            <HintFooter>
              <ExternalLink
                href={RH_OPERATOR_SUPPORT_POLICY_LINK}
                text={t('olm~Learn more about Red Hat’s third party software support policy')}
              />
            </HintFooter>
          )
        }
      />
    );
  }

  if (catalogSource === DefaultCatalogSource.RedHatMarketPlace) {
    return (
      <OperatorHubItemCustomizedHint
        title={t('olm~Marketplace Operator')}
        body={t(
          'olm~This Operator is purchased through Red Hat Marketplace. After completing the purchase process, you can install the Operator on this or other OpenShift clusters. Visit Red Hat Marketplace for more details and to track your usage of this application.',
        )}
        footer={
          <ExternalLink
            href="https://marketplace.redhat.com/en-us?utm_source=openshift_console"
            text={t('olm~Learn more about the Red Hat Marketplace')}
          />
        }
      />
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
    source,
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
  const {
    deprecatedPackage,
    deprecatedChannel,
    deprecatedVersion,
    setDeprecatedPackage,
  } = useDeprecatedOperatorWarnings();
  const deprecatedWarning =
    deprecatedPackage?.deprecation ||
    deprecatedChannel?.deprecation ||
    deprecatedVersion?.deprecation;

  React.useEffect(() => {
    setDeprecatedPackage(_.pick(item?.obj?.status, 'deprecation'));
  }, [item?.obj?.status, setDeprecatedPackage]);
  const currentChannel = obj?.status.channels.find((ch) => ch.name === installChannel);
  const selectedChannelContainerImage = currentChannel?.currentCSVDesc.annotations?.containerImage;
  const selectedChannelDescription = currentChannel?.currentCSVDesc.description || longDescription;
  const selectedChannelCreatedAt = currentChannel?.currentCSVDesc.annotations?.createdAt;
  const selectedChannelCapabilityLevel =
    currentChannel?.currentCSVDesc.annotations?.capabilities ?? item.capabilityLevel;

  const installedChannel = item?.subscription?.spec?.channel;
  const notAvailable = (
    <span className="properties-side-panel-pf-property-label">{t('olm~N/A')}</span>
  );
  const created = Date.parse(selectedChannelCreatedAt) ? (
    <Timestamp timestamp={selectedChannelCreatedAt} />
  ) : (
    selectedChannelCreatedAt
  );

  const [showCSTokenWarn, setShowCSTokenWarn] = React.useState(true);
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
                <CapabilityLevel selectedChannelCapabilityLevel={selectedChannelCapabilityLevel} />
              ) : (
                notAvailable
              )
            }
          />
          <PropertyItem label={t('olm~Source')} value={source || notAvailable} />
          <PropertyItem label={t('olm~Provider')} value={provider || notAvailable} />
          {infraFeatures?.length > 0 && (
            <PropertyItem label={t('olm~Infrastructure features')} value={mappedInfraFeatures} />
          )}
          {validSubscription?.length > 0 && (
            <PropertyItem label={t('olm~Valid Subscriptions')} value={mappedValidSubscription} />
          )}
          <PropertyItem
            label={t('olm~Repository')}
            value={repository ? <ExternalLink href={repository} text={repository} /> : notAvailable}
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
            showCSTokenWarn &&
            infraFeatures?.find((i) => i === InfrastructureFeature.TokenAuth) && (
              <CloudServiceTokenWarningAlert
                title={t('olm~Cluster in STS Mode')}
                message={t(
                  'olm~This cluster is using AWS Security Token Service to reach the cloud API. In order for this operator to take the actions it requires directly with the cloud API, you must provide a role ARN (with an attached policy) during installation. Please see the operator description for more details.',
                )}
                onClose={() => setShowCSTokenWarn(false)}
              />
            )}
          {isAzureWIFCluster(cloudCredentials, infrastructure, authentication) &&
            showCSTokenWarn &&
            infraFeatures?.find((i) => i === InfrastructureFeature.TokenAuth) && (
              <CloudServiceTokenWarningAlert
                title={t('olm~Cluster in Azure Workload Identity / Federated Identity Mode')}
                message={t(
                  'olm~This cluster is using Azure Workload Identity / Federated Identity to reach the cloud API. In order for this operator to take the actions it requires directly with the cloud API, provide the Client ID, Tenant ID, and Subscription ID during installation. See the operator description for more details.',
                )}
                onClose={() => setShowCSTokenWarn(false)}
              />
            )}
          {isGCPWIFCluster(cloudCredentials, infrastructure, authentication) &&
            showCSTokenWarn &&
            infraFeatures?.find((i) => i === InfrastructureFeature.TokenAuthGCP) && (
              <CloudServiceTokenWarningAlert
                title={t('olm~Cluster in GCP Workload Identity / Federated Identity Mode')}
                message={t(
                  'olm~This cluster is using GCP Workload Identity / Federated Identity to reach the cloud API. In order for this operator to take the actions it requires directly with the cloud API, provide the Pool ID, Provider ID, and Service Account Email during installation. See the operator description for more details.',
                )}
                onClose={() => setShowCSTokenWarn(false)}
              />
            )}
          {deprecatedWarning && (
            <DeprecatedOperatorWarningAlert
              deprecatedPackage={deprecatedPackage}
              deprecatedChannel={deprecatedChannel}
              deprecatedVersion={deprecatedVersion}
            />
          )}
          <OperatorHubItemDetailsHint
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
          {selectedChannelDescription ? (
            <MarkdownView content={selectedChannelDescription} />
          ) : (
            description
          )}
        </div>
      </div>
    </div>
  ) : null;
};

OperatorHubItemDetails.defaultProps = {
  item: null,
};

type OperatorHubItemCustomizedHintProps = {
  title?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
};

type OperatorHubItemDetailsHintProps = {
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
