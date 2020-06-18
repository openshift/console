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
import { iconFor } from '..';
import { installedFor, subscriptionFor } from '../operator-group';
import { getOperatorProviderType } from './operator-hub-utils';
import { OperatorHubTileView } from './operator-hub-items';
import {
  OperatorHubItem,
  OperatorHubCSVAnnotations,
  InstalledState,
  OperatorHubCSVAnnotationKey,
} from './index';
import { parseJSONAnnotation } from '@console/shared';

const ANNOTATIONS_WITH_JSON = [
  OperatorHubCSVAnnotationKey.infrastructureFeatures,
  OperatorHubCSVAnnotationKey.validSubscription,
];

export const OperatorHubList: React.SFC<OperatorHubListProps> = (props) => {
  const { operatorGroup, subscription, loaded, loadError, namespace = '' } = props;
  // FIXME optional chaining
  const marketplaceItems = _.get(
    props.marketplacePackageManifest,
    'data',
    [] as PackageManifestKind[],
  );

  const localItems = _.get(props, 'packageManifest.data', [] as PackageManifestKind[]); // FIXME optional chaining
  const getPackageStatus = (pkg) => _.get(pkg, 'status'); // FIXME optional chaining and/or is this needed?

  const items: OperatorHubItem[] = React.useMemo(() => {
    return marketplaceItems
      .concat(localItems)
      .filter((pkg) => {
        // if a package does not have status.defaultChannel, exclude it so the app doesn't fail
        const { defaultChannel } = getPackageStatus(pkg);
        if (!defaultChannel) {
          // eslint-disable-next-line no-console
          console.warn(
            `PackageManifest ${pkg.metadata.name} has no status.defaultChannel and has been excluded`,
          );
          return false;
        }
        return true;
      })
      .map(
        (pkg): OperatorHubItem => {
          const { channels, defaultChannel } = getPackageStatus(pkg);
          const { currentCSVDesc } = _.find(channels || [], { name: defaultChannel } as any);
          // FIXME optional chaining
          const currentCSVAnnotations: OperatorHubCSVAnnotations = _.get(
            currentCSVDesc,
            'annotations',
            {},
          );

          const [infraFeatures, validSubscription] = ANNOTATIONS_WITH_JSON.map((annotationKey) => {
            return parseJSONAnnotation(currentCSVAnnotations, annotationKey, () =>
              // eslint-disable-next-line no-console
              console.warn(`Error parsing annotation in PackageManifest ${pkg.metadata.name}`),
            );
          });

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
            name: _.get(currentCSVDesc, 'displayName', pkg.metadata.name), // FIXME optional chaining
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
            provider: _.get(pkg, 'status.provider.name', _.get(pkg, 'metadata.labels.provider')), // FIXME optional chaining
            providerType: getOperatorProviderType(pkg),
            tags: [],
            version: _.get(currentCSVDesc, 'version'), // FIXME optional chaining
            categories: _.get(currentCSVAnnotations, 'categories', '') // FIXME optional chaining
              .split(',')
              .map((category) => category.trim()),
            catalogSource: _.get(pkg, 'status.catalogSource'), // FIXME optional chaining
            catalogSourceNamespace: _.get(pkg, 'status.catalogSourceNamespace'), // FIXME optional chaining
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
            infraFeatures,
            keywords: currentCSVDesc.keywords,
          };
        },
      );
  }, [localItems, marketplaceItems, namespace, operatorGroup.data, subscription.data]);

  const uniqueItems = _.uniqBy(items, 'uid');
  if (uniqueItems.length !== items.length) {
    // eslint-disable-next-line no-console
    console.warn(
      `${items.length - uniqueItems.length} duplicate packagemanifests returned from olm query.`,
    );
  }

  return (
    <StatusBox
      skeleton={skeletonCatalog}
      data={items}
      loaded={loaded}
      loadError={loadError}
      label="Resources"
      EmptyMsg={() => (
        <MsgBox
          title="No OperatorHub Items Found"
          detail={
            <span>
              Please check that the OperatorHub is running and that you have created a valid
              OperatorSource. For more information about OperatorHub, please click{' '}
              <ExternalLink
                href="https://github.com/operator-framework/operator-marketplace"
                text="here"
              />
              .
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
            Discover Operators from the Kubernetes community and Red Hat partners, curated by Red
            Hat. You can purchase commercial software through{' '}
            <ExternalLink
              href="https://marketplace.redhat.com/en-us?utm_source=openshift_console"
              text="Red Hat Marketplace"
            />
            . You can install Operators on your clusters to provide optional add-ons and shared
            services to your developers. After installation, the Operator capabilities will appear
            in the <Link to="/catalog">Developer Catalog</Link> providing a self-service experience.
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
