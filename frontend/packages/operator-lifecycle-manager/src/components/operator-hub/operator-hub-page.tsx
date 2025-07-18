import * as React from 'react';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom-v5-compat';
import { OPERATOR_BACKED_SERVICE_CATALOG_TYPE_ID } from '@console/dev-console/src/const';
import { Firehose, skeletonCatalog, StatusBox } from '@console/internal/components/utils';
import {
  referenceForModel,
  CloudCredentialKind,
  InfrastructureKind,
  AuthenticationKind,
} from '@console/internal/module/k8s';
import { fromRequirements } from '@console/internal/module/k8s/selector';
import { isCatalogTypeEnabled, useIsSoftwareCatalogEnabled } from '@console/shared';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { ConsoleEmptyState } from '@console/shared/src/components/empty-state';
import { ErrorBoundaryFallbackPage, withFallback } from '@console/shared/src/components/error';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import PageBody from '@console/shared/src/components/layout/PageBody';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { iconFor } from '..';
import {
  CloudCredentialModel,
  AuthenticationModel,
  InfrastructureModel,
} from '../../../../../public/models';
import { NON_STANDALONE_ANNOTATION_VALUE } from '../../const';
import {
  ClusterServiceVersionModel,
  PackageManifestModel,
  OperatorGroupModel,
  SubscriptionModel,
} from '../../models';
import {
  ClusterServiceVersionKind,
  PackageManifestKind,
  OperatorGroupKind,
  SubscriptionKind,
} from '../../types';
import { subscriptionFor } from '../operator-group';
import { OperatorHubTileView } from './operator-hub-items';
import {
  getInfrastructureFeatures,
  getPackageSource,
  getValidSubscription,
  isAWSSTSCluster,
  isAzureWIFCluster,
  isGCPWIFCluster,
} from './operator-hub-utils';
import { OperatorHubItem, InstalledState, OLMAnnotation, CSVAnnotations } from './index';

const clusterServiceVersionFor = (
  clusterServiceVersions: ClusterServiceVersionKind[],
  csvName: string,
): ClusterServiceVersionKind =>
  clusterServiceVersions?.find((csv) => csv.metadata.name === csvName);

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

const OperatorHubEmptyState = () => {
  const { t } = useTranslation('olm');
  const actions = [
    <ExternalLink
      key="more-info"
      href="https://github.com/operator-framework/operator-marketplace"
      text={t('More info')}
    />,
  ];
  return (
    <ConsoleEmptyState title={t('No OperatorHub items found')} primaryActions={actions}>
      {t('Check that the OperatorHub is running and that you have created a valid CatalogSource.')}
    </ConsoleEmptyState>
  );
};

export const OperatorHubList: React.FC<OperatorHubListProps> = ({
  loaded,
  loadError,
  namespace,
  ...props
}) => {
  const { t } = useTranslation();
  const items: OperatorHubItem[] = React.useMemo(() => {
    if (!loaded || loadError) {
      return [];
    }
    const operatorGroups = props.operatorGroups?.data ?? [];
    const subscriptions = props.subscriptions?.data ?? [];
    const clusterServiceVersions = props.clusterServiceVersions?.data ?? [];
    const cloudCredentials = props.cloudCredentials?.data ?? null;
    const authentication = props.authentication?.data ?? null;
    const infrastructure = props.infrastructure?.data ?? null;
    const packageManifests = props.packageManifests?.data ?? [];
    const marketplacePackageManifests = props.marketplacePackageManifests?.data ?? [];
    const allPackageManifests = [...marketplacePackageManifests, ...packageManifests];
    const clusterIsAWSSTS = isAWSSTSCluster(cloudCredentials, infrastructure, authentication);
    const clusterIsAzureWIF = isAzureWIFCluster(cloudCredentials, infrastructure, authentication);
    const clusterIsGCPWIF = isGCPWIFCluster(cloudCredentials, infrastructure, authentication);
    return allPackageManifests
      .filter((pkg) => {
        const { channels, defaultChannel } = pkg.status ?? {};
        // if a package does not have status.defaultChannel, exclude it so the app doesn't fail
        if (!defaultChannel) {
          // eslint-disable-next-line no-console
          console.warn(
            `PackageManifest ${pkg.metadata.name} has no status.defaultChannel and has been excluded`,
          );
          return false;
        }

        const { currentCSVDesc } = channels.find((ch) => ch.name === defaultChannel);
        // if CSV contains annotation for a non-standalone operator, filter it out
        return !(
          currentCSVDesc.annotations?.[OLMAnnotation.OperatorType] ===
          NON_STANDALONE_ANNOTATION_VALUE
        );
      })
      .map(
        (pkg): OperatorHubItem => {
          const subscription =
            loaded && subscriptionFor(subscriptions)(operatorGroups)(pkg)(namespace);
          const clusterServiceVersion =
            loaded &&
            clusterServiceVersionFor(clusterServiceVersions, subscription?.status?.installedCSV);
          const { channels, defaultChannel } = pkg.status ?? {};
          const { currentCSVDesc } = (channels || []).find(({ name }) => name === defaultChannel);
          const currentCSVAnnotations: CSVAnnotations = currentCSVDesc?.annotations ?? {};
          const infraFeatures = getInfrastructureFeatures(currentCSVAnnotations, {
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

          const installed = loaded && clusterServiceVersion?.status?.phase === 'Succeeded';

          return {
            authentication,
            capabilityLevel,
            catalogSource: pkg.status.catalogSource,
            catalogSourceNamespace: pkg.status.catalogSourceNamespace,
            categories: (currentCSVAnnotations?.categories ?? '')
              .split(',')
              .map((category) => category.trim()),
            certifiedLevel,
            cloudCredentials,
            containerImage,
            createdAt,
            description: currentCSVAnnotations.description || currentCSVDesc.description,
            healthIndex,
            imgUrl: iconFor(pkg),
            infraFeatures,
            infrastructure,
            installed,
            installState: installed ? InstalledState.Installed : InstalledState.NotInstalled,
            isInstalling:
              loaded &&
              !_.isNil(subscription) &&
              !_.isNil(clusterServiceVersion?.status?.phase) &&
              clusterServiceVersion?.status?.phase !== 'Succeeded',
            keywords: currentCSVDesc?.keywords ?? [],
            kind: PackageManifestModel.kind,
            longDescription: currentCSVDesc.description || currentCSVAnnotations.description,
            marketplaceActionText,
            marketplaceRemoteWorkflow,
            marketplaceSupportWorkflow,
            name: currentCSVDesc?.displayName ?? pkg.metadata.name,
            obj: pkg,
            provider: pkg.status.provider?.name ?? pkg.metadata.labels?.provider,
            repository,
            source: getPackageSource(pkg),
            subscription,
            support,
            tags: [],
            uid: `${pkg.metadata.name}-${pkg.status.catalogSource}-${pkg.status.catalogSourceNamespace}`,
            validSubscription,
            validSubscriptionFilters,
            version: currentCSVDesc?.version,
          };
        },
      );
  }, [
    loadError,
    loaded,
    namespace,
    props.authentication?.data,
    props.cloudCredentials?.data,
    props.clusterServiceVersions?.data,
    props.infrastructure?.data,
    props.marketplacePackageManifests?.data,
    props.operatorGroups?.data,
    props.packageManifests?.data,
    props.subscriptions?.data,
  ]);

  const uniqueItems = _.uniqBy(items, 'uid');
  if (uniqueItems.length !== items.length) {
    // eslint-disable-next-line no-console
    console.warn(`${items.length - uniqueItems.length} duplicate PackageManifests.`);
  }

  return (
    <StatusBox
      skeleton={skeletonCatalog}
      data={items}
      loaded={loaded}
      loadError={loadError}
      label={t('olm~Resources')}
      EmptyMsg={OperatorHubEmptyState}
    >
      <OperatorHubTileView items={uniqueItems} namespace={namespace} />
    </StatusBox>
  );
};

export const OperatorHubPage = withFallback((props) => {
  const params = useParams();
  const isSoftwareCatalogEnabled = useIsSoftwareCatalogEnabled();
  const isOperatorBackedServiceEnabled = isCatalogTypeEnabled(
    OPERATOR_BACKED_SERVICE_CATALOG_TYPE_ID,
  );
  return (
    <>
      <DocumentTitle>OperatorHub</DocumentTitle>
      <PageBody>
        <PageHeading
          title="OperatorHub"
          helpText={
            isSoftwareCatalogEnabled && isOperatorBackedServiceEnabled ? (
              <Trans ns="olm">
                Discover Operators from the Kubernetes community and Red Hat partners, curated by
                Red Hat. You can install Operators on your clusters to provide optional add-ons and
                shared services to your developers. After installation, the Operator capabilities
                will appear in the <Link to="/catalog">Software Catalog</Link>, providing a
                self-service experience.
              </Trans>
            ) : (
              <Trans ns="olm">
                Discover Operators from the Kubernetes community and Red Hat partners, curated by
                Red Hat. You can install Operators on your clusters to provide optional add-ons and
                shared services to your developers. The Operator Backed Software Catalog is
                currently disabled, thus Operator capabilities will not be exposed to developers.
              </Trans>
            )
          }
        />
        <Firehose
          resources={[
            {
              isList: true,
              kind: referenceForModel(OperatorGroupModel),
              prop: 'operatorGroups',
            },
            {
              isList: true,
              kind: referenceForModel(PackageManifestModel),
              namespace: params.ns,
              selector: { 'openshift-marketplace': 'true' },
              prop: 'marketplacePackageManifests',
            },
            {
              isList: true,
              kind: referenceForModel(PackageManifestModel),
              namespace: params.ns,
              selector: fromRequirements([
                { key: 'opsrc-owner-name', operator: 'DoesNotExist' },
                { key: 'csc-owner-name', operator: 'DoesNotExist' },
              ]),
              prop: 'packageManifests',
            },
            {
              isList: true,
              kind: referenceForModel(SubscriptionModel),
              prop: 'subscriptions',
            },
            {
              kind: referenceForModel(ClusterServiceVersionModel),
              namespaced: true,
              isList: true,
              namespace: params.ns,
              prop: 'clusterServiceVersions',
            },
            {
              kind: referenceForModel(CloudCredentialModel),
              prop: 'cloudCredentials',
              name: 'cluster',
            },
            {
              kind: referenceForModel(InfrastructureModel),
              prop: 'infrastructure',
              name: 'cluster',
            },
            {
              kind: referenceForModel(AuthenticationModel),
              prop: 'authentication',
              name: 'cluster',
            },
          ]}
        >
          {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
          <OperatorHubList {...(props as any)} namespace={params.ns} />
        </Firehose>
      </PageBody>
    </>
  );
}, ErrorBoundaryFallbackPage);

export type OperatorHubListProps = {
  namespace?: string;
  operatorGroups: { loaded: boolean; data?: OperatorGroupKind[] };
  packageManifests: { loaded: boolean; data?: PackageManifestKind[] };
  marketplacePackageManifests: { loaded: boolean; data?: PackageManifestKind[] };
  subscriptions: { loaded: boolean; data?: SubscriptionKind[] };
  cloudCredentials: { loaded: boolean; data?: CloudCredentialKind };
  infrastructure: { loaded: boolean; data?: InfrastructureKind };
  authentication: { loaded: boolean; data?: AuthenticationKind };
  loaded: boolean;
  loadError?: string;
  clusterServiceVersions: { loaded: boolean; data?: ClusterServiceVersionKind[] };
};

OperatorHubList.displayName = 'OperatorHubList';
OperatorHubPage.displayName = 'OperatorHubPage';
