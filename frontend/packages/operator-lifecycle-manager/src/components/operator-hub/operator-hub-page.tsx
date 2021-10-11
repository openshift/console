import * as React from 'react';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { Trans, useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { Link } from 'react-router-dom';
import { ErrorBoundaryFallback } from '@console/internal/components/error';
import {
  Firehose,
  PageHeading,
  StatusBox,
  MsgBox,
  ExternalLink,
  skeletonCatalog,
} from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { fromRequirements } from '@console/internal/module/k8s/selector';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import { parseJSONAnnotation } from '@console/shared/src/utils/annotations';
import { iconFor } from '..';
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
import { getCatalogSourceDisplayName } from './operator-hub-utils';
import {
  OperatorHubItem,
  OperatorHubCSVAnnotations,
  InstalledState,
  OperatorHubCSVAnnotationKey,
  InfraFeatures,
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

export const OperatorHubList: React.FC<OperatorHubListProps> = ({
  loaded,
  loadError,
  marketplacePackageManifests,
  namespace,
  operatorGroups,
  packageManifests,
  subscriptions,
  clusterServiceVersions,
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
          const [parsedInfraFeatures = [], validSubscription] = ANNOTATIONS_WITH_JSON.map(
            (annotationKey) => {
              return parseJSONAnnotation(currentCSVAnnotations, annotationKey, () =>
                // eslint-disable-next-line no-console
                console.warn(`Error parsing annotation in PackageManifest ${pkg.metadata.name}`),
              );
            },
          );
          const filteredInfraFeatures = _.uniq(
            _.compact(_.map(parsedInfraFeatures, (key) => InfraFeatures[key])),
          );

          const {
            certifiedLevel,
            healthIndex,
            repository,
            containerImage,
            createdAt,
            support,
            capabilities: capabilityLevel,
            [OperatorHubCSVAnnotationKey.actionText]: marketplaceActionText,
            [OperatorHubCSVAnnotationKey.remoteWorkflow]: marketplaceRemoteWorkflow,
            [OperatorHubCSVAnnotationKey.supportWorkflow]: marketplaceSupportWorkflow,
          } = currentCSVAnnotations;

          const subscription =
            loaded && subscriptionFor(subscriptions?.data)(operatorGroups?.data)(pkg)(namespace);

          const clusterServiceVersion =
            loaded &&
            clusterServiceVersionFor(
              clusterServiceVersions?.data,
              subscription?.status?.currentCSV,
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
            catalogSourceDisplayName: getCatalogSourceDisplayName(pkg),
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
            infraFeatures: filteredInfraFeatures,
            keywords: currentCSVDesc?.keywords ?? [],
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

export const OperatorHubPage = withFallback(
  (props: OperatorHubPageProps) => (
    <>
      <Helmet>
        <title>OperatorHub</title>
      </Helmet>
      <div className="co-m-page__body">
        <div className="co-catalog">
          <PageHeading title="OperatorHub" />
          <p className="co-catalog-page__description">
            <Trans ns="olm">
              Discover Operators from the Kubernetes community and Red Hat partners, curated by Red
              Hat. You can purchase commercial software through{' '}
              <ExternalLink href="https://marketplace.redhat.com/en-us?utm_source=openshift_console">
                Red Hat Marketplace
              </ExternalLink>
              . You can install Operators on your clusters to provide optional add-ons and shared
              services to your developers. After installation, the Operator capabilities will appear
              in the <Link to="/catalog">Developer Catalog</Link> providing a self-service
              experience.
            </Trans>
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
                  namespace: props.match.params.ns,
                  selector: { 'openshift-marketplace': 'true' },
                  prop: 'marketplacePackageManifests',
                },
                {
                  isList: true,
                  kind: referenceForModel(PackageManifestModel),
                  namespace: props.match.params.ns,
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
                  namespace: props.match.params.ns,
                  prop: 'clusterServiceVersions',
                },
              ]}
            >
              {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
              <OperatorHubList {...(props as any)} namespace={props.match.params.ns} />
            </Firehose>
          </div>
        </div>
      </div>
    </>
  ),
  ErrorBoundaryFallback,
);

export type OperatorHubPageProps = {
  match: match<{ ns?: string }>;
};

export type OperatorHubListProps = {
  namespace?: string;
  operatorGroups: { loaded: boolean; data?: OperatorGroupKind[] };
  packageManifests: { loaded: boolean; data?: PackageManifestKind[] };
  marketplacePackageManifests: { loaded: boolean; data?: PackageManifestKind[] };
  subscriptions: { loaded: boolean; data?: SubscriptionKind[] };
  loaded: boolean;
  loadError?: string;
  clusterServiceVersions: { loaded: boolean; data?: ClusterServiceVersionKind[] };
};

OperatorHubList.displayName = 'OperatorHubList';
OperatorHubPage.displayName = 'OperatorHubPage';
