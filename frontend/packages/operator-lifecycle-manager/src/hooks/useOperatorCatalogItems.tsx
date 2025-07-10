import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useActiveNamespace, CatalogItem } from '@console/dynamic-plugin-sdk/src/lib-core';
import { parseList, PlainList, strConcat } from '@console/shared/src';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { iconFor } from '../components';
import { subscriptionFor } from '../components/operator-group';
import { InstalledState, OLMAnnotation, CSVAnnotations } from '../components/operator-hub/index';
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
  const [
    cloudCredentials,
    cloudCredentialsLoaded,
    cloudCredentialsLoadError,
  ] = useClusterCloudCredentialConfig();
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
      cloudCredentialsLoaded &&
      infrastructureLoaded &&
      authenticationLoaded,
    [
      authenticationLoaded,
      cloudCredentialsLoaded,
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
        cloudCredentialsLoadError,
        infrastructureLoadError,
        authenticationLoadError,
      ),
    [
      authenticationLoadError,
      cloudCredentialsLoadError,
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
          categories,
          capabilities,
          certifiedLevel,
          healthIndex,
          repository,
          containerImage,
          createdAt,
          support,
          capabilities: capabilityLevel,
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
        const tags = (categories ?? '').split(',').map((category) => category.trim());
        const imgUrl = iconFor(pkg);
        const type = 'operator';

        // Build install parameters URL
        const installParamsURL = new URLSearchParams({
          pkg: pkg.metadata.name,
          catalog: catalogSource,
          catalogNamespace: catalogSourceNamespace,
          targetNamespace: namespace,
        }).toString();

        const installLink = `/operatorhub/subscribe?${installParamsURL}`;
        const uninstallLink = subscription
          ? `/k8s/ns/${subscription.metadata.namespace}/${SubscriptionModel.plural}/${subscription.metadata.name}?showDelete=true`
          : null;

        const supportWorkflowUrl = getSupportWorkflowUrl(marketplaceSupportWorkflow);

        // Build calls to action based on install state
        const ctas = [];
        if (!installed) {
          // Add install action for non-installed operators
          ctas.push({
            label: t('Install'),
            href: installLink,
            variant: 'primary' as const,
          });
        } else if (installed && uninstallLink) {
          // Add uninstall action for installed operators
          ctas.push({
            label: t('Uninstall'),
            href: uninstallLink,
            variant: 'secondary' as const,
          });
        }

        return {
          uid,
          type,
          // typeLabel: '',
          name,
          title: name,
          // secondaryLabel: '',
          provider,
          description,
          tags,
          creationTimestamp: createdAt,
          supportUrl: support,
          // documentationUrl,
          attributes: {
            keywords,
            source,
            provider,
            infrastructureFeatures,
            capabilities,
            validSubscription: validSubscriptionFilters,
          },
          ctas,
          icon: {
            url: imgUrl,
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
  return [items, loaded, loadError];
};

export default useOperatorCatalogItems;
