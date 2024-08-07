import * as React from 'react';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom-v5-compat';
import { OPERATOR_BACKED_SERVICE_CATALOG_TYPE_ID } from '@console/dev-console/src/const';
import {
  DOC_URL_RED_HAT_MARKETPLACE,
  ExternalLink,
  Firehose,
  MsgBox,
  PageHeading,
  skeletonCatalog,
  StatusBox,
} from '@console/internal/components/utils';
import {
  referenceForModel,
  CloudCredentialKind,
  InfrastructureKind,
  AuthenticationKind,
} from '@console/internal/module/k8s';
import { fromRequirements } from '@console/internal/module/k8s/selector';
import { isCatalogTypeEnabled, useIsDeveloperCatalogEnabled } from '@console/shared';
import { ErrorBoundaryFallbackPage, withFallback } from '@console/shared/src/components/error';
import { parseJSONAnnotation } from '@console/shared/src/utils/annotations';
import { iconFor } from '..';
import {
  CloudCredentialModel,
  AuthenticationModel,
  InfrastructureModel,
} from '../../../../../public/models';
import { OPERATOR_TYPE_ANNOTATION, NON_STANDALONE_ANNOTATION_VALUE } from '../../const';
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
  getPackageSource,
  isAWSSTSCluster,
  isAzureWIFCluster,
  isGCPWIFCluster,
  normalizedInfrastructureFeatures,
} from './operator-hub-utils';
import {
  OperatorHubItem,
  OperatorHubCSVAnnotations,
  InstalledState,
  OperatorHubCSVAnnotationKey,
  InfraFeatures,
  ValidSubscriptionValue,
} from './index';

const ANNOTATIONS_WITH_JSON = [
  OperatorHubCSVAnnotationKey.infrastructureFeatures,
  OperatorHubCSVAnnotationKey.validSubscription,
];

const clusterServiceVersionFor = (
  clusterServiceVersions: ClusterServiceVersionKind[],
  csvName: string,
): ClusterServiceVersionKind => {
  return clusterServiceVersions?.find((csv) => csv.metadata.name === csvName);
};

export const getValidSubscriptionFilters = (validSubscription) =>
  Object.keys(
    (validSubscription ?? []).reduce((map, value) => {
      const k =
        {
          [ValidSubscriptionValue.OpenShiftKubernetesEngine]:
            ValidSubscriptionValue.OpenShiftKubernetesEngine,
          [ValidSubscriptionValue.OpenShiftContainerPlatform]:
            ValidSubscriptionValue.OpenShiftContainerPlatform,
          [ValidSubscriptionValue.OpenShiftPlatformPlus]:
            ValidSubscriptionValue.OpenShiftPlatformPlus,
        }[value] ?? ValidSubscriptionValue.RequiresSeparateSubscription;
      return {
        ...map,
        [k]: true,
      };
    }, {}),
  );

export const OperatorHubList: React.FC<OperatorHubListProps> = ({
  loaded,
  loadError,
  marketplacePackageManifests,
  namespace,
  operatorGroups,
  packageManifests,
  subscriptions,
  clusterServiceVersions,
  cloudCredentials,
  authentication,
  infrastructure,
}) => {
  const { t } = useTranslation();
  const items: OperatorHubItem[] = React.useMemo(() => {
    return [...(marketplacePackageManifests?.data ?? []), ...(packageManifests?.data ?? [])]
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
          currentCSVDesc.annotations?.[OPERATOR_TYPE_ANNOTATION] === NON_STANDALONE_ANNOTATION_VALUE
        );
      })
      .map(
        (pkg): OperatorHubItem => {
          const { channels, defaultChannel } = pkg.status ?? {};
          const { currentCSVDesc } = (channels || []).find(({ name }) => name === defaultChannel);
          const currentCSVAnnotations: OperatorHubCSVAnnotations =
            currentCSVDesc?.annotations ?? {};
          const [parsedInfraFeatures, validSubscription] = ANNOTATIONS_WITH_JSON.map(
            (annotationKey) =>
              parseJSONAnnotation(currentCSVAnnotations, annotationKey, () =>
                // eslint-disable-next-line no-console
                console.warn(`Error parsing annotation in PackageManifest ${pkg.metadata.name}`),
              ) ?? [],
          );

          const {
            certifiedLevel,
            healthIndex,
            repository,
            containerImage,
            createdAt,
            support,
            capabilities: capabilityLevel,
            [OperatorHubCSVAnnotationKey.disconnected]: disconnected,
            [OperatorHubCSVAnnotationKey.fipsCompliant]: fipsCompliant,
            [OperatorHubCSVAnnotationKey.proxyAware]: proxyAware,
            [OperatorHubCSVAnnotationKey.cnf]: cnf,
            [OperatorHubCSVAnnotationKey.cni]: cni,
            [OperatorHubCSVAnnotationKey.csi]: csi,
            [OperatorHubCSVAnnotationKey.tlsProfiles]: tlsProfiles,
            [OperatorHubCSVAnnotationKey.tokenAuthAWS]: tokenAuthAWS,
            [OperatorHubCSVAnnotationKey.tokenAuthAzure]: tokenAuthAzure,
            [OperatorHubCSVAnnotationKey.tokenAuthGCP]: tokenAuthGCP,
            [OperatorHubCSVAnnotationKey.actionText]: marketplaceActionText,
            [OperatorHubCSVAnnotationKey.remoteWorkflow]: marketplaceRemoteWorkflow,
            [OperatorHubCSVAnnotationKey.supportWorkflow]: marketplaceSupportWorkflow,
          } = currentCSVAnnotations;

          const subscription =
            loaded && subscriptionFor(subscriptions?.data)(operatorGroups?.data)(pkg)(namespace);

          const cloudCredential = loaded && cloudCredentials?.data;

          const infra = loaded && infrastructure?.data;

          const auth = loaded && authentication?.data;

          // old infra feature annotation
          let infrastructureFeatures: InfraFeatures[] = parsedInfraFeatures.map(
            (key) => normalizedInfrastructureFeatures[key],
          );

          // new infra feature annotation
          const featuresAnnotationsObjects = [
            { key: InfraFeatures.disconnected, value: disconnected },
            { key: InfraFeatures.fipsMode, value: fipsCompliant },
            { key: InfraFeatures.proxyAware, value: proxyAware },
            { key: InfraFeatures.cnf, value: cnf },
            { key: InfraFeatures.cni, value: cni },
            { key: InfraFeatures.csi, value: csi },
            { key: InfraFeatures.tlsProfiles, value: tlsProfiles },
          ];

          // override old with new
          featuresAnnotationsObjects.forEach(({ key, value }) => {
            if (value === 'false') {
              // override existing operators.openshift.io/infrastructure-features annotation value
              infrastructureFeatures = infrastructureFeatures.filter((feature) => feature !== key);
            } else if (value === 'true') {
              infrastructureFeatures.push(key);
            }
          });

          if (tokenAuthAWS === 'true' && isAWSSTSCluster(cloudCredential, infra, auth)) {
            infrastructureFeatures.push(InfraFeatures.tokenAuth);
          } else if (tokenAuthGCP === 'true' && isGCPWIFCluster(cloudCredential, infra, auth)) {
            infrastructureFeatures.push(InfraFeatures.tokenAuthGCP);
          } else if (tokenAuthAzure === 'true' && isAzureWIFCluster(cloudCredential, infra, auth)) {
            infrastructureFeatures.push(InfraFeatures.tokenAuth);
          }

          const infraFeatures = _.uniq(_.compact(infrastructureFeatures));

          const clusterServiceVersion =
            loaded &&
            clusterServiceVersionFor(
              clusterServiceVersions?.data,
              subscription?.status?.installedCSV,
            );

          const installed = loaded && clusterServiceVersion?.status?.phase === 'Succeeded';

          return {
            obj: pkg,
            kind: PackageManifestModel.kind,
            name: currentCSVDesc?.displayName ?? pkg.metadata.name,
            uid: `${pkg.metadata.name}-${pkg.status.catalogSource}-${pkg.status.catalogSourceNamespace}`,
            installed,
            isInstalling:
              loaded &&
              !_.isNil(subscription) &&
              !_.isNil(clusterServiceVersion?.status?.phase) &&
              clusterServiceVersion?.status?.phase !== 'Succeeded',
            subscription,
            installState: installed ? InstalledState.Installed : InstalledState.NotInstalled,
            imgUrl: iconFor(pkg),
            description: currentCSVAnnotations.description || currentCSVDesc.description,
            longDescription: currentCSVDesc.description || currentCSVAnnotations.description,
            provider: pkg.status.provider?.name ?? pkg.metadata.labels?.provider,
            tags: [],
            version: currentCSVDesc?.version,
            categories: (currentCSVAnnotations?.categories ?? '')
              .split(',')
              .map((category) => category.trim()),
            catalogSource: pkg.status.catalogSource,
            source: getPackageSource(pkg),
            catalogSourceNamespace: pkg.status.catalogSourceNamespace,
            certifiedLevel,
            healthIndex,
            repository,
            containerImage,
            createdAt,
            support,
            capabilityLevel,
            marketplaceActionText,
            marketplaceRemoteWorkflow,
            marketplaceSupportWorkflow,
            validSubscription,
            validSubscriptionFilters: getValidSubscriptionFilters(validSubscription),
            infraFeatures,
            keywords: currentCSVDesc?.keywords ?? [],
            cloudCredentials: cloudCredential,
            infrastructure: infra,
            authentication: auth,
          };
        },
      );
  }, [
    clusterServiceVersions,
    loaded,
    marketplacePackageManifests,
    namespace,
    operatorGroups,
    packageManifests,
    subscriptions,
    cloudCredentials,
    infrastructure,
    authentication,
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
      EmptyMsg={() => (
        <MsgBox
          title={t('olm~No OperatorHub items found')}
          detail={
            <span>
              <Trans ns="olm">
                Please check that the OperatorHub is running and that you have created a valid
                CatalogSource. For more information about OperatorHub, please click{' '}
                <ExternalLink
                  href="https://github.com/operator-framework/operator-marketplace"
                  text={t('olm~here')}
                />
                .
              </Trans>
            </span>
          }
        />
      )}
    >
      <OperatorHubTileView items={uniqueItems} namespace={namespace} />
    </StatusBox>
  );
};

export const OperatorHubPage = withFallback((props) => {
  const params = useParams();
  const isDevCatalogEnabled = useIsDeveloperCatalogEnabled();
  const isOperatorBackedServiceEnabled = isCatalogTypeEnabled(
    OPERATOR_BACKED_SERVICE_CATALOG_TYPE_ID,
  );
  return (
    <>
      <Helmet>
        <title>OperatorHub</title>
      </Helmet>
      <div className="co-m-page__body">
        <div className="co-catalog">
          <PageHeading title="OperatorHub" />
          <p className="co-catalog-page__description">
            {isDevCatalogEnabled && isOperatorBackedServiceEnabled ? (
              <Trans ns="olm">
                Discover Operators from the Kubernetes community and Red Hat partners, curated by
                Red Hat. You can purchase commercial software through{' '}
                <ExternalLink href={DOC_URL_RED_HAT_MARKETPLACE}>Red Hat Marketplace</ExternalLink>.
                You can install Operators on your clusters to provide optional add-ons and shared
                services to your developers. After installation, the Operator capabilities will
                appear in the <Link to="/catalog">Developer Catalog</Link> providing a self-service
                experience.
              </Trans>
            ) : (
              <Trans ns="olm">
                Discover Operators from the Kubernetes community and Red Hat partners, curated by
                Red Hat. You can purchase commercial software through{' '}
                <ExternalLink href={DOC_URL_RED_HAT_MARKETPLACE}>Red Hat Marketplace</ExternalLink>.
                You can install Operators on your clusters to provide optional add-ons and shared
                services to your developers. The Operator Backed Developer Catalog is currently
                disabled, thus Operator capabilities will not be exposed to developers.
              </Trans>
            )}
          </p>
          <div className="co-catalog__body">
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
          </div>
        </div>
      </div>
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
