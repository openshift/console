import { useMemo, useEffect } from 'react';
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
  Stack,
  StackItem,
  AlertVariant,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { referenceForModel } from '@console/internal/module/k8s';
import { DismissableAlert, RH_OPERATOR_SUPPORT_POLICY_LINK } from '@console/shared';
import CatalogPageOverlay from '@console/shared/src/components/catalog/catalog-view/CatalogPageOverlay';
import CatalogPageOverlayDescription from '@console/shared/src/components/catalog/catalog-view/CatalogPageOverlayDescription';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { DefaultCatalogSource } from '../../const';
import { useCurrentCSVDescription } from '../../hooks/useCurrentCSVDescription';
import { ClusterServiceVersionModel, SubscriptionModel } from '../../models';
import { ClusterServiceVersionKind, SubscriptionKind } from '../../types';
import { MarkdownView } from '../clusterserviceversion';
import { DeprecatedOperatorWarningAlert } from '../deprecated-operator-warnings/deprecated-operator-warnings';
import { useDeprecatedOperatorWarnings } from '../deprecated-operator-warnings/use-deprecated-operator-warnings';
import { defaultChannelNameFor } from '../index';
import { OperatorChannelSelect, OperatorVersionSelect } from './operator-channel-version-select';
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

export const CapabilityLevel: React.FCC<CapabilityLevelProps> = ({ capability }) => {
  const { t } = useTranslation();
  const capabilityLevelIndex = levels.indexOf(capability);

  return (
    <ul className="properties-side-panel-pf-property-value__capability-levels">
      {levels.map((level, i) => {
        const active = capabilityLevelIndex >= i;
        return (
          <li
            className={css('properties-side-panel-pf-property-value__capability-level', {
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
  capability: string;
};

const InstalledHint: React.FCC<InstalledHintProps> = ({
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
  const to = installedCSV
    ? resourcePathFromModel(
        ClusterServiceVersionModel,
        installedCSV?.metadata?.name,
        subscription?.metadata?.namespace,
      )
    : resourcePathFromModel(
        SubscriptionModel,
        subscription.metadata.name,
        subscription.metadata.namespace,
      );
  const installedVersion = installedCSV?.spec?.version;
  return (
    <Hint>
      <HintTitle>{t('olm~Installed Operator')}</HintTitle>
      <HintBody>
        {t('olm~This Operator has been installed on the cluster.')}{' '}
        <Link to={to}>{t('olm~View it here.')}</Link>
      </HintBody>
      {installedVersion !== latestVersion ? (
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
      ) : null}
    </Hint>
  );
};

const InstallingHint: React.FCC<InstallingHintProps> = ({ subscription }) => {
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
  const to = installedCSV
    ? `${resourcePathFromModel(
        ClusterServiceVersionModel,
        installedCSV?.metadata?.name,
        subscription?.metadata?.namespace,
      )}/subscription`
    : resourcePathFromModel(
        SubscriptionModel,
        subscription.metadata.name,
        subscription.metadata.namespace,
      );
  return (
    <Hint>
      <HintTitle>{t('olm~Installing Operator')}</HintTitle>
      <HintBody>{t('olm~This Operator is being installed on the cluster.')}</HintBody>
      <HintFooter>
        <Link to={to}>{t('olm~View it here.')}</Link>
      </HintFooter>
    </Hint>
  );
};

const OperatorHubItemDetailsHint: React.FCC<OperatorHubItemDetailsHintProps> = (props) => {
  const { t } = useTranslation();
  const {
    installed,
    isInstalling,
    catalogSource,
    subscription,
    latestVersion,
    installedChannel,
  } = props;
  if (isInstalling) {
    return (
      <StackItem>
        <InstallingHint subscription={subscription} />
      </StackItem>
    );
  }

  if (installed) {
    return (
      <StackItem>
        <InstalledHint
          latestVersion={latestVersion}
          subscription={subscription}
          installedChannel={installedChannel}
        />
      </StackItem>
    );
  }

  if (catalogSource === DefaultCatalogSource.CommunityOperators) {
    return (
      <StackItem>
        <Hint>
          <HintTitle>{t('olm~Community Operator')}</HintTitle>
          <HintBody>
            {t(
              'olm~This is a community provided Operator. These are Operators which have not been vetted or verified by Red Hat. Community Operators should be used with caution because their stability is unknown. Red Hat provides no support for community Operators.',
            )}
          </HintBody>
          <HintFooter>
            <ExternalLink
              href={RH_OPERATOR_SUPPORT_POLICY_LINK}
              text={t('olm~Learn more about Red Hat’s third party software support policy')}
            />
          </HintFooter>
        </Hint>
      </StackItem>
    );
  }
  return null;
};

export const OperatorDescription: React.FCC<OperatorDescriptionProps> = ({
  catalogSource,
  description,
  infraFeatures,
  installed,
  isInstalling,
  subscription,
  version,
  clusterIsAWSSTS,
  clusterIsAzureWIF,
  clusterIsGCPWIF,
  longDescription,
  packageManifest,
}) => {
  const { t } = useTranslation();
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
  const installedChannel = subscription?.spec?.channel;
  const currentCSVDescription = useCurrentCSVDescription(packageManifest);
  const selectedChannelDescription = currentCSVDescription?.description || longDescription;
  const packageManifestStatus = packageManifest?.status;
  const [isTokenAuth, isTokenAuthGCP] = useMemo(() => {
    return [
      (infraFeatures ?? []).includes(InfrastructureFeature.TokenAuth),
      (infraFeatures ?? []).includes(InfrastructureFeature.TokenAuthGCP),
    ];
  }, [infraFeatures]);

  useEffect(() => {
    setDeprecatedPackage({ deprecation: packageManifestStatus?.deprecation });
  }, [packageManifestStatus, setDeprecatedPackage]);

  return (
    <Stack hasGutter>
      {clusterIsAWSSTS && isTokenAuth && (
        <StackItem>
          <DismissableAlert title={t('olm~Cluster in STS Mode')} variant={AlertVariant.warning}>
            {t(
              'olm~This cluster is using AWS Security Token Service to reach the cloud API. In order for this operator to take the actions it requires directly with the cloud API, you must provide a role ARN (with an attached policy) during installation. Please see the operator description for more details.',
            )}
          </DismissableAlert>
        </StackItem>
      )}
      {clusterIsAzureWIF && isTokenAuth && (
        <StackItem>
          <DismissableAlert
            title={t('olm~Cluster in Azure Workload Identity / Federated Identity Mode')}
            variant={AlertVariant.warning}
          >
            {t(
              'olm~This cluster is using Azure Workload Identity / Federated Identity to reach the cloud API. In order for this operator to take the actions it requires directly with the cloud API, provide the Client ID, Tenant ID, and Subscription ID during installation. See the operator description for more details.',
            )}
          </DismissableAlert>
        </StackItem>
      )}
      {clusterIsGCPWIF && isTokenAuthGCP && (
        <StackItem>
          <DismissableAlert
            title={t('olm~Cluster in GCP Workload Identity / Federated Identity Mode')}
            variant={AlertVariant.warning}
          >
            {t(
              'olm~This cluster is using GCP Workload Identity / Federated Identity to reach the cloud API. In order for this operator to take the actions it requires directly with the cloud API, provide the Pool ID, Provider ID, and Service Account Email during installation. See the operator description for more details.',
            )}
          </DismissableAlert>
        </StackItem>
      )}
      {deprecatedWarning && (
        <StackItem>
          <DeprecatedOperatorWarningAlert
            deprecatedPackage={deprecatedPackage}
            deprecatedChannel={deprecatedChannel}
            deprecatedVersion={deprecatedVersion}
          />
        </StackItem>
      )}
      <OperatorHubItemDetailsHint
        installed={installed}
        isInstalling={isInstalling}
        latestVersion={version}
        catalogSource={catalogSource}
        subscription={subscription}
        installedChannel={installedChannel}
      />
      <StackItem>
        {selectedChannelDescription ? (
          <MarkdownView content={selectedChannelDescription} />
        ) : (
          description
        )}
      </StackItem>
    </Stack>
  );
};

export const OperatorHubItemDetails: React.FCC<OperatorHubItemDetailsProps> = ({
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

  const currentCSVDescription = useCurrentCSVDescription(obj);
  const { containerImage, createdAt } = currentCSVDescription?.annotations ?? {};
  const capability = currentCSVDescription?.annotations?.capabilities ?? item.capabilityLevel;

  const notAvailable = t('olm~N/A');
  const created = Date.parse(createdAt) ? <Timestamp timestamp={createdAt} /> : createdAt;

  const mappedData = (data) => data?.map?.((d) => <div key={d}>{d}</div>) ?? notAvailable;

  const mappedInfraFeatures = mappedData(infraFeatures);
  const mappedValidSubscription = mappedData(validSubscription);

  const supportWorkflowUrl = useMemo(() => {
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
  const clusterIsAWSSTS = isAWSSTSCluster(cloudCredentials, infrastructure, authentication);
  const clusterIsAzureWIF = isAzureWIFCluster(cloudCredentials, infrastructure, authentication);
  const clusterIsGCPWIF = isGCPWIFCluster(cloudCredentials, infrastructure, authentication);

  return item ? (
    <div className="modal-body modal-body-border">
      <CatalogPageOverlay>
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
            value={capability ? <CapabilityLevel capability={capability} /> : notAvailable}
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
              containerImage ? (
                <div className="co-break-all co-select-to-copy">{containerImage}</div>
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
        <CatalogPageOverlayDescription>
          <OperatorDescription
            catalogSource={catalogSource}
            description={description}
            infraFeatures={infraFeatures}
            installed={installed}
            isInstalling={isInstalling}
            subscription={subscription}
            version={version}
            clusterIsAWSSTS={clusterIsAWSSTS}
            clusterIsAzureWIF={clusterIsAzureWIF}
            clusterIsGCPWIF={clusterIsGCPWIF}
            longDescription={longDescription}
            packageManifest={obj}
          />
        </CatalogPageOverlayDescription>
      </CatalogPageOverlay>
    </div>
  ) : null;
};

OperatorHubItemDetails.defaultProps = {
  item: null,
};

type InstallingHintProps = {
  subscription: SubscriptionKind;
};

type InstalledHintProps = {
  latestVersion: string;
  subscription: SubscriptionKind;
  installedChannel: string;
};

type OperatorHubItemDetailsHintProps = {
  installed: boolean;
  isInstalling: boolean;
  latestVersion: string;
  catalogSource: string;
  subscription: SubscriptionKind;
  installedChannel: string;
};

export type OperatorDescriptionProps = {
  catalogSource: string;
  description: string;
  infraFeatures: InfrastructureFeature[];
  installed: boolean;
  isInstalling: boolean;
  subscription: SubscriptionKind;
  version: string;
  clusterIsAWSSTS: boolean;
  clusterIsAzureWIF: boolean;
  clusterIsGCPWIF: boolean;
  longDescription: string;
  packageManifest: any;
};

export type OperatorHubItemDetailsProps = {
  item: OperatorHubItem;
  updateChannel: string;
  updateVersion: string;
  setUpdateChannel: (updateChannel: string) => void;
  setUpdateVersion: (updateVersion: string) => void;
};

OperatorHubItemDetails.displayName = 'OperatorHubItemDetails';
