import * as React from 'react';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { match } from 'react-router';
import {
  Firehose,
  PageHeading,
  StatusBox,
  MsgBox,
  ExternalLink,
  skeletonCatalog,
} from '@console/internal/components/utils';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import { ErrorBoundaryFallback } from '@console/internal/components/error';
import { referenceForModel } from '@console/internal/module/k8s';
import { fromRequirements } from '@console/internal/module/k8s/selector';
import { PackageManifestModel, OperatorGroupModel, SubscriptionModel } from '../../models';
import { PackageManifestKind, OperatorGroupKind, SubscriptionKind } from '../../types';
import { OPERATOR_TYPE_ANNOTATION, NON_STANDALONE_ANNOTATION_VALUE } from '../../const';
import { iconFor } from '..';
import { installedFor, subscriptionFor } from '../operator-group';
import { getCatalogSourceDisplayName } from './operator-hub-utils';
import { OperatorHubTileView } from './operator-hub-items';
import {
  OperatorHubItem,
  OperatorHubCSVAnnotations,
  InstalledState,
  OperatorHubCSVAnnotationKey,
  InfraFeatures,
} from './index';
import { parseJSONAnnotation } from '@console/shared/src/utils/annotations';
import { Trans, useTranslation } from 'react-i18next';

const ANNOTATIONS_WITH_JSON = [
  OperatorHubCSVAnnotationKey.infrastructureFeatures,
  OperatorHubCSVAnnotationKey.validSubscription,
];

export const OperatorHubList: React.FC<OperatorHubListProps> = ({
  loaded,
  loadError,
  marketplacePackageManifest,
  namespace,
  operatorGroup,
  packageManifest,
  subscription,
}) => {
  const { t } = useTranslation();
  const items: OperatorHubItem[] = React.useMemo(() => {
    return [...(marketplacePackageManifest?.data ?? []), ...(packageManifest?.data ?? [])]
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

          return {
            obj: pkg,
            kind: PackageManifestModel.kind,
            name: currentCSVDesc?.displayName ?? pkg.metadata.name,
            uid: `${pkg.metadata.name}-${pkg.status.catalogSource}-${pkg.status.catalogSourceNamespace}`,
            installed: installedFor(subscription.data)(operatorGroup.data)(pkg.status.packageName)(
              namespace,
            ),
            subscription: subscriptionFor(subscription.data)(operatorGroup.data)(
              pkg.status.packageName,
            )(namespace),
            // FIXME: Just use `installed`
            installState: installedFor(subscription.data)(operatorGroup.data)(
              pkg.status.packageName,
            )(namespace)
              ? InstalledState.Installed
              : InstalledState.NotInstalled,
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
    marketplacePackageManifest,
    namespace,
    operatorGroup.data,
    packageManifest,
    subscription.data,
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
                  prop: 'operatorGroup',
                },
                {
                  isList: true,
                  kind: referenceForModel(PackageManifestModel),
                  namespace: props.match.params.ns,
                  selector: { 'openshift-marketplace': 'true' },
                  prop: 'marketplacePackageManifest',
                },
                {
                  isList: true,
                  kind: referenceForModel(PackageManifestModel),
                  namespace: props.match.params.ns,
                  selector: fromRequirements([
                    { key: 'opsrc-owner-name', operator: 'DoesNotExist' },
                    { key: 'csc-owner-name', operator: 'DoesNotExist' },
                  ]),
                  prop: 'packageManifest',
                },
                {
                  isList: true,
                  kind: referenceForModel(SubscriptionModel),
                  prop: 'subscription',
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
  operatorGroup: { loaded: boolean; data?: OperatorGroupKind[] };
  packageManifest: { loaded: boolean; data?: PackageManifestKind[] };
  marketplacePackageManifest: { loaded: boolean; data?: PackageManifestKind[] };
  subscription: { loaded: boolean; data?: SubscriptionKind[] };
  loaded: boolean;
  loadError?: string;
};

OperatorHubList.displayName = 'OperatorHubList';
OperatorHubPage.displayName = 'OperatorHubPage';
