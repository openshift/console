import * as React from 'react';
import { Spinner } from '@patternfly/react-core';
import { CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  useActiveNamespace,
  CatalogItem,
  CatalogItemBadge,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { parseList, PlainList, strConcat } from '@console/shared/src';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { iconFor } from '../components';
import { subscriptionFor } from '../components/operator-group';
import {
  InstalledState,
  OLMAnnotation,
  CSVAnnotations,
  InfrastructureFeature,
  TokenizedAuthProvider,
} from '../components/operator-hub/index';
import {
  OperatorVersionSelect,
  OperatorChannelSelect,
} from '../components/operator-hub/operator-channel-version-select';
import {
  CapabilityLevel,
  OperatorDescription,
} from '../components/operator-hub/operator-hub-item-details';
import {
  getInfrastructureFeatures,
  getPackageSource,
  getSupportWorkflowUrl,
  getValidSubscription,
  isAWSSTSCluster,
  isAzureWIFCluster,
  isGCPWIFCluster,
} from '../components/operator-hub/operator-hub-utils';
import { PackageManifestModel, SubscriptionModel } from '../models';
import { PackageManifestKind } from '../types';
import { clusterServiceVersionFor } from '../utils/clusterserviceversions';
import { getCurrentCSVDescription } from '../utils/packagemanifests';
import { useClusterAuthenticationConfig } from './useClusterAuthenticationConfig';
import { useClusterCloudCredentialConfig } from './useClusterCloudCredentialConfig';
import { useClusterInfrastructureConfig } from './useClusterInfrastructureConfig';
import { useClusterServiceVersions } from './useClusterServiceVersions';
import { useOperatorGroups } from './useOperatorGroups';
import { useOperatorHubPackageManifests } from './useOperatorHubPackageManifests';
import { useSubscriptions } from './useSubscriptions';

const onInfrastructureFeaturesAnnotationError = (error: Error, pkg: PackageManifestKind) =>
  // eslint-disable-next-line no-console
  console.warn(
    `Error parsing infrastructure features from PackageManifest "${pkg.metadata.name}":`,
    error,
  );

const onValidSubscriptionAnnotationError = (error: Error, pkg: PackageManifestKind) =>
  // eslint-disable-next-line no-console
  console.warn(
    `Error parsing valid subscription from PackageManifest "${pkg.metadata.name}":`,
    error,
  );

export const useOperatorCatalogItems = () => {
  const { t } = useTranslation('olm');
  const [namespace] = useActiveNamespace();
  const [operatorGroups, operatorGroupsLoaded, operatorGroupsLoadError] = useOperatorGroups();
  const [
    operatorHubPackageManifests,
    operatorHubPackageManifestsLoaded,
    operatorHubPackageManifestsLoadError,
  ] = useOperatorHubPackageManifests(namespace);
  const [subscriptions, subscriptionsLoaded, subscriptionsLoadError] = useSubscriptions();
  const [
    clusterServiceVersions,
    clusterServiceVersionsLoaded,
    clusterServiceVersionsLoadError,
  ] = useClusterServiceVersions(namespace);
  // cloudCredentials are optional
  const [cloudCredentials] = useClusterCloudCredentialConfig();
  const [
    infrastructure,
    infrastructureLoaded,
    infrastructureLoadError,
  ] = useClusterInfrastructureConfig();
  const [
    authentication,
    authenticationLoaded,
    authenticationLoadError,
  ] = useClusterAuthenticationConfig();

  const [updateChannel, setUpdateChannel] = React.useState('');
  const [updateVersion, setUpdateVersion] = React.useState('');

  const loaded = React.useMemo(
    () =>
      operatorGroupsLoaded &&
      operatorHubPackageManifestsLoaded &&
      subscriptionsLoaded &&
      clusterServiceVersionsLoaded &&
      infrastructureLoaded &&
      authenticationLoaded,
    [
      authenticationLoaded,
      clusterServiceVersionsLoaded,
      infrastructureLoaded,
      operatorGroupsLoaded,
      operatorHubPackageManifestsLoaded,
      subscriptionsLoaded,
    ],
  );

  const loadError = React.useMemo(
    () =>
      strConcat(
        operatorGroupsLoadError,
        operatorHubPackageManifestsLoadError,
        subscriptionsLoadError,
        clusterServiceVersionsLoadError,
        infrastructureLoadError,
        authenticationLoadError,
      ),
    [
      authenticationLoadError,
      clusterServiceVersionsLoadError,
      infrastructureLoadError,
      operatorHubPackageManifestsLoadError,
      operatorGroupsLoadError,
      subscriptionsLoadError,
    ],
  );

  const clusterIsAWSSTS = isAWSSTSCluster(cloudCredentials, infrastructure, authentication);
  const clusterIsAzureWIF = isAzureWIFCluster(cloudCredentials, infrastructure, authentication);
  const clusterIsGCPWIF = isGCPWIFCluster(cloudCredentials, infrastructure, authentication);

  const items = React.useMemo(() => {
    if (!loaded || loadError) {
      return [];
    }

    const allItems = operatorHubPackageManifests.map(
      (pkg): CatalogItem => {
        const { kind } = PackageManifestModel;
        const { catalogSource, catalogSourceNamespace } = pkg.status;
        const source = getPackageSource(pkg);
        const subscription = subscriptionFor(subscriptions)(operatorGroups)(pkg)(namespace);
        const clusterServiceVersion = clusterServiceVersionFor(clusterServiceVersions)(
          subscription,
        );
        const channel = updateChannel || pkg.status.defaultChannel || pkg.status.channels[0]?.name;
        const currentCSVDesc = getCurrentCSVDescription(pkg);
        const { displayName } = currentCSVDesc ?? {};
        const currentCSVAnnotations: CSVAnnotations = currentCSVDesc?.annotations ?? {};
        const infrastructureFeatures = getInfrastructureFeatures(currentCSVAnnotations, {
          clusterIsAWSSTS,
          clusterIsAzureWIF,
          clusterIsGCPWIF,
          onError: (error) => onInfrastructureFeaturesAnnotationError(error, pkg),
        });
        const [validSubscription, validSubscriptionFilters] = getValidSubscription(
          currentCSVAnnotations,
          {
            onError: (error) => onValidSubscriptionAnnotationError(error, pkg),
          },
        );
        const {
          capabilities,
          certifiedLevel,
          healthIndex,
          repository,
          containerImage,
          createdAt,
          support,
          capabilities: capabilityLevel,
          [OLMAnnotation.Categories]: categories,
          [OLMAnnotation.ActionText]: marketplaceActionText,
          [OLMAnnotation.RemoteWorkflow]: marketplaceRemoteWorkflow,
          [OLMAnnotation.SupportWorkflow]: marketplaceSupportWorkflow,
        } = currentCSVAnnotations;
        const keywords =
          currentCSVDesc?.keywords || parseList(currentCSVAnnotations?.keywords || '') || [];
        const installed = clusterServiceVersion?.status?.phase === 'Succeeded';
        const isInstalling =
          loaded &&
          !_.isNil(subscription) &&
          !_.isNil(clusterServiceVersion?.status?.phase) &&
          clusterServiceVersion?.status?.phase !== 'Succeeded';
        const installState = installed ? InstalledState.Installed : InstalledState.NotInstalled;
        const description = currentCSVAnnotations?.description || currentCSVDesc?.description;
        const longDescription = currentCSVDesc?.description || currentCSVAnnotations?.description;
        const name = displayName ?? pkg.metadata.name;
        const obj = pkg;
        const provider =
          currentCSVDesc?.provider?.name ||
          pkg.status.provider?.name ||
          pkg.metadata.labels?.provider;
        const uid = `${pkg.metadata.name}-${pkg.status.catalogSource}-${pkg.status.catalogSourceNamespace}`;
        const latestVersion = currentCSVDesc?.version;
        const tags = (categories ?? '')
          .toLowerCase()
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);
        const imgUrl = iconFor(pkg);
        const type = 'operator';

        // Compute tokenizedAuth per operator based on its infrastructureFeatures
        // Only set tokenizedAuth if both the cluster supports it AND the operator supports it
        // (i.e., the operator's CSV annotations don't have token-auth-aws/azure/gcp=false)
        let operatorTokenizedAuth: TokenizedAuthProvider | undefined;
        if (clusterIsAWSSTS && infrastructureFeatures.includes(InfrastructureFeature.TokenAuth)) {
          operatorTokenizedAuth = 'AWS';
        } else if (
          clusterIsAzureWIF &&
          infrastructureFeatures.includes(InfrastructureFeature.TokenAuth)
        ) {
          operatorTokenizedAuth = 'Azure';
        } else if (
          clusterIsGCPWIF &&
          infrastructureFeatures.includes(InfrastructureFeature.TokenAuthGCP)
        ) {
          operatorTokenizedAuth = 'GCP';
        }

        // Build install parameters URL
        const installParams: Record<string, string> = {
          pkg: pkg.metadata.name,
          catalog: catalogSource,
          catalogNamespace: catalogSourceNamespace,
          targetNamespace: namespace,
        };
        if (operatorTokenizedAuth) {
          installParams.tokenizedAuth = operatorTokenizedAuth;
        }
        const installParamsURL = new URLSearchParams(installParams).toString();

        const installLink = `/operatorhub/subscribe?${installParamsURL}`;
        const uninstallLink = subscription
          ? `/k8s/ns/${subscription.metadata.namespace}/${SubscriptionModel.plural}/${subscription.metadata.name}?showDelete=true`
          : null;

        const supportWorkflowUrl = getSupportWorkflowUrl(marketplaceSupportWorkflow);

        const cta =
          installed && uninstallLink
            ? {
                label: t('Uninstall'),
                href: uninstallLink,
                variant: 'secondary',
              }
            : {
                label: t('Install'),
                href: installLink,
                variant: 'primary',
              };

        const badges = [
          ...(installed && !isInstalling
            ? [
                {
                  text: t('Installed'),
                  color: 'green',
                  variant: 'outline',
                  icon: <CheckCircleIcon />,
                } as CatalogItemBadge,
              ]
            : []),
          ...(isInstalling
            ? [
                {
                  text: t('Installing'),
                  color: 'blue',
                  variant: 'outline',
                  icon: <Spinner size="sm" />,
                } as CatalogItemBadge,
              ]
            : []),
          ...(pkg?.status?.deprecation
            ? [
                {
                  text: t('Deprecated'),
                  color: 'orange',
                  tooltip: pkg.status.deprecation.message,
                  variant: 'outline',
                  icon: <ExclamationCircleIcon />,
                } as CatalogItemBadge,
              ]
            : []),
        ];

        return {
          attributes: {
            capabilities,
            infrastructureFeatures,
            installState,
            keywords,
            provider,
            source,
            validSubscription: validSubscriptionFilters,
            metadataName: pkg.metadata.name, // Add metadata name for enhanced scoring
          },
          badges,
          creationTimestamp: createdAt,
          cta,
          description,
          data: {
            authentication,
            capabilityLevel,
            catalogSource,
            catalogSourceNamespace,
            categories,
            certifiedLevel,
            cloudCredentials,
            containerImage,
            createdAt,
            description,
            healthIndex,
            imgUrl,
            infrastructureFeatures,
            infrastructure,
            installed,
            installState,
            isInstalling,
            keywords,
            kind,
            longDescription,
            marketplaceActionText,
            marketplaceRemoteWorkflow,
            marketplaceSupportWorkflow,
            name,
            obj,
            provider,
            repository,
            source,
            subscription,
            support,
            tags,
            uid,
            validSubscription,
            validSubscriptionFilters,
            version: latestVersion,
          },
          details: {
            properties: [
              {
                label: t('Channel'),
                value: (
                  <OperatorChannelSelect
                    packageManifest={pkg}
                    selectedUpdateChannel={channel}
                    setUpdateChannel={setUpdateChannel}
                    setUpdateVersion={setUpdateVersion}
                  />
                ),
              },
              {
                label: t('Version'),
                value: (
                  <OperatorVersionSelect
                    packageManifest={pkg}
                    selectedUpdateChannel={channel}
                    updateVersion={updateVersion}
                    setUpdateVersion={setUpdateVersion}
                  />
                ),
              },
              {
                label: t('Capability level'),
                value: <CapabilityLevel capability={capabilities} />,
              },
              { label: t('Source'), value: source || '-' },
              { label: t('Provider'), value: provider || '-' },
              {
                label: t('Infrastructure features'),
                value: infrastructureFeatures?.length ? (
                  <PlainList items={infrastructureFeatures} />
                ) : (
                  '-'
                ),
              },
              {
                label: t('Valid subscriptions'),
                value: validSubscription?.length ? <PlainList items={validSubscription} /> : '-',
              },
              {
                label: t('Repository'),
                value: repository ? <ExternalLink href={repository} text={repository} /> : '-',
              },
              { label: t('Container image'), value: containerImage || '-' },
              {
                label: t('Created at'),
                value: createdAt ? <Timestamp timestamp={createdAt} /> : '-',
              },
              {
                label: t('Support'),
                value: supportWorkflowUrl ? (
                  <ExternalLink href={supportWorkflowUrl}>{t('Get support')}</ExternalLink>
                ) : (
                  support || '-'
                ),
              },
            ],
            descriptions: [
              {
                value: (
                  <OperatorDescription
                    catalogSource={catalogSource}
                    description={description}
                    infraFeatures={infrastructureFeatures}
                    installed={installed}
                    isInstalling={isInstalling}
                    subscription={subscription}
                    version={latestVersion}
                    clusterIsAWSSTS={clusterIsAWSSTS}
                    clusterIsAzureWIF={clusterIsAzureWIF}
                    clusterIsGCPWIF={clusterIsGCPWIF}
                    longDescription={longDescription}
                    packageManifest={pkg}
                  />
                ),
              },
            ],
          },
          icon: {
            url: imgUrl,
          },
          name,
          provider,
          supportUrl: support,
          tags,
          title: name,
          type,
          typeLabel: source,
          uid,
        };
      },
    );
    const uniqueItems = _.uniqBy(allItems, 'uid');
    const dupCount = allItems.length - uniqueItems.length;
    if (dupCount > 0) {
      // eslint-disable-next-line no-console
      console.warn(`${dupCount} duplicate PackageManifests.`);
    }
    return uniqueItems;
  }, [
    authentication,
    cloudCredentials,
    clusterIsAWSSTS,
    clusterIsAzureWIF,
    clusterIsGCPWIF,
    clusterServiceVersions,
    infrastructure,
    loadError,
    loaded,
    namespace,
    operatorGroups,
    operatorHubPackageManifests,
    subscriptions,
    t,
    updateChannel,
    updateVersion,
  ]);

  return [items, loaded];
};

export default useOperatorCatalogItems;
