import type { ReactNode, FC } from 'react';
import { useState, useCallback } from 'react';
import { Button, DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { K8sResourceKind, WatchK8sResultsObject } from '@console/dynamic-plugin-sdk';
import { PopoverStatus, StatusIconAndText, useAccessReview } from '@console/dynamic-plugin-sdk';
import type { GetDataViewRows } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { CreateYAML } from '@console/internal/components/create-yaml';
import type { TableProps, MultiListPageProps } from '@console/internal/components/factory';
import { DetailsPage, MultiListPage } from '@console/internal/components/factory';
import {
  LoadingBox,
  ConsoleEmptyState,
  navFactory,
  ResourceLink,
  SectionHeading,
  asAccessReview,
  ResourceSummary,
  DetailsItem,
} from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import i18n from '@console/internal/i18n';
import { ConfigMapModel } from '@console/internal/models';
import type { K8sKind, K8sModel } from '@console/internal/module/k8s';
import { referenceForModel, k8sPatch } from '@console/internal/module/k8s';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import { withFallback } from '@console/shared/src/components/error/fallbacks/withFallback';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DEFAULT_SOURCE_NAMESPACE } from '../const';
import {
  SubscriptionModel,
  CatalogSourceModel,
  PackageManifestModel,
  OperatorGroupModel,
  OperatorHubModel,
} from '../models';
import type { CatalogSourceKind, PackageManifestKind, OperatorGroupKind } from '../types';
import { ClassicOperatorMigrationAlert } from './classic-operators/ClassicOperatorMigrationAlert';
import { requireOperatorGroup } from './operator-group';
import type { OperatorHubKind } from './operator-hub';
import { PackageManifestsPage } from './package-manifest';
import { RegistryPollIntervalDetailItem } from './registry-poll-interval-details';
import type { CatalogSourceTableRowObj } from './useCatalogSourceColumns';
import { useCatalogSourceColumns } from './useCatalogSourceColumns';

const catalogSourceModelReference = referenceForModel(CatalogSourceModel);

const enableSource = (kind: K8sKind, operatorHub: OperatorHubKind, sourceName: string) => ({
  // t('olm~Enable')
  labelKey: 'olm~Enable',
  callback: () => {
    const currentSources = _.get(operatorHub, 'spec.sources', []);
    const patch = [
      {
        op: 'add',
        path: '/spec/sources',
        value: _.filter(currentSources, (source) => source.name !== sourceName),
      },
    ];
    return k8sPatch(kind, operatorHub, patch);
  },
  accessReview: asAccessReview(kind, operatorHub, 'patch'),
});

const getOperatorCount = (
  catalogSource: CatalogSourceKind,
  packageManifests: PackageManifestKind[],
): number =>
  packageManifests.filter(
    (p) =>
      p.status?.catalogSource === catalogSource.metadata.name &&
      p.status?.catalogSourceNamespace === catalogSource.metadata.namespace,
  ).length;

const getEndpoint = (catalogSource: CatalogSourceKind): ReactNode => {
  if (catalogSource.spec.configmap) {
    return (
      <ResourceLink
        kind={referenceForModel(ConfigMapModel)}
        name={catalogSource.spec.configmap}
        namespace={catalogSource.metadata.namespace}
      />
    );
  }
  return catalogSource.spec.image || catalogSource.spec.address;
};

export const CatalogSourceDetails: FC<CatalogSourceDetailsProps> = ({
  obj: catalogSource,
  packageManifests,
}) => {
  const { t } = useTranslation('olm');

  const operatorCount = getOperatorCount(catalogSource, packageManifests);

  const catsrcNamespace =
    catalogSource.metadata.namespace === DEFAULT_SOURCE_NAMESPACE
      ? 'Cluster wide'
      : catalogSource.metadata.namespace;

  return !_.isEmpty(catalogSource) ? (
    <PaneBody>
      <SectionHeading
        text={t('CatalogSource details', {
          resource: CatalogSourceModel.label,
        })}
      />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={catalogSource} />
        </GridItem>
        <GridItem sm={6}>
          <DescriptionList>
            <DetailsItem
              editAsGroup
              label={t('Status')}
              obj={catalogSource}
              path="status.connectionState.lastObservedState"
            />
            <DetailsItem label={t('Display name')} obj={catalogSource} path="spec.displayName" />
            <DetailsItem label={t('Publisher')} obj={catalogSource} path="spec.publisher" />
            <DetailsItem
              label={t('Availability')}
              obj={catalogSource}
              description={t(
                'Denotes whether this CatalogSource provides operators to a specific namespace, or the entire cluster.',
              )}
            >
              {catsrcNamespace}
            </DetailsItem>
            <DetailsItem
              label="Endpoint"
              obj={catalogSource}
              description={t("The ConfigMap, image, or address for this CatalogSource's registry.")}
            >
              {getEndpoint(catalogSource)}
            </DetailsItem>
            <RegistryPollIntervalDetailItem catalogSource={catalogSource} />
            <DetailsItem
              label={t('Number of Operators')}
              obj={catalogSource}
              description={t('The number of packages this CatalogSource provides.')}
            >
              {operatorCount}
            </DetailsItem>
          </DescriptionList>
        </GridItem>
      </Grid>
    </PaneBody>
  ) : (
    <div />
  );
};

const CatalogSourceOperatorsPage: FC<CatalogSourceOperatorsPageProps> = (props) => (
  <PackageManifestsPage
    catalogSource={props.obj}
    showTitle={false}
    showMigrationAlert={false}
    {...props}
  />
);

export const CatalogSourceDetailsPage: FC = (props) => {
  const { t } = useTranslation('olm');
  const params = useParams();

  return (
    <DetailsPage
      {...props}
      helpAlert={<ClassicOperatorMigrationAlert />}
      namespace={params.ns}
      kind={referenceForModel(CatalogSourceModel)}
      customActionMenu={(kindObj: K8sModel, obj: K8sResourceKind) => (
        <LazyActionMenu
          context={{
            [referenceForModel(CatalogSourceModel)]: obj,
          }}
          variant={ActionMenuVariant.DROPDOWN}
          label={t('Actions')}
        />
      )}
      name={params.name}
      pages={[
        navFactory.details(CatalogSourceDetails),
        navFactory.editYaml(),
        {
          href: 'operators',
          // t('olm~Operators')
          nameKey: 'olm~Operators',
          component: CatalogSourceOperatorsPage,
        },
      ]}
      resources={[
        {
          kind: referenceForModel(PackageManifestModel),
          isList: true,
          namespace: params.ns,
          prop: 'packageManifests',
        },
      ]}
    />
  );
};

export const CreateSubscriptionYAML: FC = () => {
  type CreateProps = {
    packageManifest: { loaded: boolean; data?: PackageManifestKind; loadError?: unknown };
    operatorGroup: { loaded: boolean; data?: OperatorGroupKind[]; loadError?: unknown };
  };
  const { t } = useTranslation('olm');
  const params = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const resources = useK8sWatchResources<{
    packageManifest: PackageManifestKind;
    operatorGroup: OperatorGroupKind[];
  }>({
    packageManifest: {
      kind: referenceForModel(PackageManifestModel),
      isList: false,
      name: searchParams.get('pkg'),
      namespace: searchParams.get('catalogNamespace'),
    },
    operatorGroup: {
      kind: referenceForModel(OperatorGroupModel),
      isList: true,
      namespace: params.ns,
    },
  });

  const Create = requireOperatorGroup(
    withFallback<CreateProps>(
      (createProps) => {
        if (createProps.packageManifest.loaded && createProps.packageManifest.data) {
          const pkg = createProps.packageManifest.data;
          const channel = pkg.status.defaultChannel
            ? pkg.status.channels.find(({ name }) => name === pkg.status.defaultChannel)
            : pkg.status.channels[0];

          const template = `
          apiVersion: ${SubscriptionModel.apiGroup}/${SubscriptionModel.apiVersion}
          kind: ${SubscriptionModel.kind},
          metadata:
            generateName: ${pkg.metadata.name}-
            namespace: default
          spec:
            source: ${searchParams.get('catalog')}
            sourceNamespace: ${searchParams.get('catalogNamespace')}
            name: ${pkg.metadata.name}
            startingCSV: ${channel.currentCSV}
            channel: ${channel.name}
        `;
          return <CreateYAML plural={SubscriptionModel.plural} template={template} />;
        }
        return <LoadingBox />;
      },
      () => (
        <ConsoleEmptyState title={t('Package not found')}>
          {t('Cannot create a Subscription to a non-existent package.')}
        </ConsoleEmptyState>
      ),
    ),
  );

  return (
    <Create packageManifest={resources.packageManifest} operatorGroup={resources.operatorGroup} />
  );
};

/**
 * A disabled default source is dimmed. ConsoleDataView rows carry per-cell props rather than row
 * props, so the styling is applied to every cell of the row.
 */
const disabledCellProps = {
  className: 'pf-v6-u-background-color-disabled pf-v6-u-text-color-on-disabled',
};

const getCatalogSourceMetadata = (obj: CatalogSourceTableRowObj) => ({ name: obj.name });

export const getCatalogSourceDataViewRows: GetDataViewRows<CatalogSourceTableRowObj> = (
  data,
  columns,
) =>
  data.map(({ obj }) => {
    const {
      availability = '-',
      disabled,
      endpoint = '-',
      name,
      operatorCount = 0,
      publisher = '-',
      registryPollInterval = '-',
      status = '',
      source,
    } = obj;
    const rowCells = {
      name: {
        cell: source ? (
          <ResourceLink
            kind={catalogSourceModelReference}
            name={source.metadata.name}
            namespace={source.metadata.namespace}
          />
        ) : (
          name
        ),
      },
      status: {
        cell: status,
        // A disabled default source has no CatalogSource, so there is no name to key a test id on.
        props: source ? { 'data-test': `${source.metadata.name}-status` } : undefined,
      },
      publisher: { cell: publisher },
      availability: { cell: availability },
      endpoint: { cell: endpoint },
      registryPollInterval: { cell: registryPollInterval },
      operatorCount: { cell: operatorCount || '-' },
      actions: {
        // A disabled default source has no CatalogSource to act on.
        cell: source && (
          <LazyActionMenu context={{ [referenceForModel(CatalogSourceModel)]: source }} />
        ),
      },
    };
    return columns.map(({ id }) => {
      const { props, ...rest } = rowCells[id];
      return {
        id,
        ...rest,
        props: disabled ? { ...props, ...disabledCellProps } : props,
      };
    });
  });

const CatalogSourceList: FC<TableProps> = (props) => {
  const { t } = useTranslation('olm');
  const { columns } = useCatalogSourceColumns();
  return (
    <ConsoleDataView<CatalogSourceTableRowObj>
      {...props}
      id="console.ui~v1~OperatorHubSourcesList"
      label={t('CatalogSources')}
      data={props.data || []}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getCatalogSourceDataViewRows}
      getObjectMetadata={getCatalogSourceMetadata}
      hideLabelFilter
    />
  );
};

const DisabledPopover: FC<DisabledPopoverProps> = ({ operatorHub, sourceName }) => {
  const [visible, setVisible] = useState<boolean>(null);
  const close = useCallback(() => {
    setVisible(false);
  }, []);
  const onClickEnable = useCallback(
    () => enableSource(OperatorHubModel, operatorHub, sourceName).callback().then(close),
    [close, operatorHub, sourceName],
  );
  const { t } = useTranslation('olm');
  const [canPatchOperatorHub] = useAccessReview({
    group: OperatorHubModel.apiGroup,
    resource: OperatorHubModel.plural,
    verb: 'patch',
    name: operatorHub?.metadata?.name,
  });
  return (
    <PopoverStatus
      title={t('Disabled')}
      isVisible={visible}
      shouldClose={close}
      statusBody={<StatusIconAndText title={t('Disabled')} />}
    >
      <p>
        {t(
          'Operators provided by this source will not appear in Software Catalog and any operators installed from this source will not receive updates until this source is re-enabled.',
        )}
      </p>
      {canPatchOperatorHub && (
        <Button isInline variant="link" onClick={onClickEnable}>
          {t('Enable source')}
        </Button>
      )}
    </PopoverStatus>
  );
};

const getRegistryPollInterval = (catalogSource: CatalogSourceKind): string =>
  catalogSource.spec?.updateStrategy?.registryPoll?.interval;

const flatten = ({
  catalogSources,
  operatorHub,
  packageManifests,
}: FlattenArgType): CatalogSourceTableRowObj[] => {
  const defaultSources: CatalogSourceTableRowObj[] = _.map(
    operatorHub.status?.sources,
    (defaultSource) => {
      const catalogSource = _.find(catalogSources.data, {
        metadata: { name: defaultSource.name, namespace: DEFAULT_SOURCE_NAMESPACE },
      });
      const catalogSourceExists = !_.isEmpty(catalogSource);
      return {
        availability: catalogSourceExists ? (
          i18n.t('olm~Cluster wide')
        ) : (
          <DisabledPopover operatorHub={operatorHub} sourceName={defaultSource.name} />
        ),
        // Add a string value for sorting by availability since React elements can't be sorted.
        availabilitySort: catalogSourceExists ? 'Cluster wide' : 'Disabled',
        disabled: !catalogSourceExists,
        isDefault: true,
        name: defaultSource.name,
        namespace: DEFAULT_SOURCE_NAMESPACE,
        operatorHub,
        ...(catalogSourceExists && {
          source: catalogSource,
          endpoint: getEndpoint(catalogSource),
          operatorCount: getOperatorCount(catalogSource, packageManifests.data),
          publisher: catalogSource.spec.publisher,
          registryPollInterval: getRegistryPollInterval(catalogSource),
          status: catalogSource.status?.connectionState?.lastObservedState,
        }),
      };
    },
  );

  const customSources: CatalogSourceTableRowObj[] = _.map(catalogSources.data, (source) => ({
    availability:
      source.metadata.namespace === DEFAULT_SOURCE_NAMESPACE
        ? i18n.t('olm~Cluster wide')
        : source.metadata.namespace,
    endpoint: getEndpoint(source),
    name: source.metadata.name,
    namespace: source.metadata.namespace,
    operatorCount: getOperatorCount(source, packageManifests.data),
    operatorHub,
    publisher: source.spec.publisher,
    registryPollInterval: getRegistryPollInterval(source),
    status: source.status?.connectionState?.lastObservedState,
    source,
  }));

  return _.unionWith(
    defaultSources,
    customSources,
    (a, b) => a.name === b.name && a.namespace === b.namespace,
  );
};

export const CatalogSourceListPage: FC<CatalogSourceListPageProps> = (props) => {
  const { t } = useTranslation('olm');
  return (
    <MultiListPage
      {...props}
      canCreate
      createAccessReview={{ model: CatalogSourceModel }}
      createButtonText={t('Create CatalogSource')}
      createProps={{ to: `/k8s/cluster/${referenceForModel(CatalogSourceModel)}/~new` }}
      flatten={(data) => flatten({ operatorHub: props.obj, ...data })}
      ListComponent={CatalogSourceList}
      omitFilterToolbar
      resources={[
        {
          isList: true,
          kind: referenceForModel(PackageManifestModel),
          prop: 'packageManifests',
        },
        {
          isList: true,
          kind: catalogSourceModelReference,
          prop: 'catalogSources',
        },
      ]}
    />
  );
};

type DisabledPopoverProps = {
  operatorHub: OperatorHubKind;
  sourceName: string;
};

type FlattenArgType = {
  catalogSources?: WatchK8sResultsObject<CatalogSourceKind[]>;
  packageManifests?: WatchK8sResultsObject<PackageManifestKind[]>;
  operatorHub: OperatorHubKind;
};

export type CatalogSourceDetailsProps = {
  obj: CatalogSourceKind;
  packageManifests: PackageManifestKind[];
};

export type CatalogSourceListPageProps = {
  obj: OperatorHubKind;
} & MultiListPageProps;

type CatalogSourceOperatorsPageProps = {
  obj: CatalogSourceKind;
} & MultiListPageProps;

CatalogSourceDetails.displayName = 'CatalogSourceDetails';
CatalogSourceDetailsPage.displayName = 'CatalogSourceDetailPage';
CreateSubscriptionYAML.displayName = 'CreateSubscriptionYAML';
