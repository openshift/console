import * as React from 'react';
import { Button, DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { sortable } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import { PopoverStatus, StatusIconAndText } from '@console/dynamic-plugin-sdk';
import { CreateYAML } from '@console/internal/components/create-yaml';
import {
  DetailsPage,
  Table,
  TableData,
  TableProps,
  MultiListPage,
  MultiListPageProps,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import {
  Firehose,
  Kebab,
  LoadingBox,
  ConsoleEmptyState,
  navFactory,
  ResourceKebab,
  ResourceLink,
  SectionHeading,
  asAccessReview,
  KebabOption,
  ResourceSummary,
  DetailsItem,
  FirehoseResult,
} from '@console/internal/components/utils';
import i18n from '@console/internal/i18n';
import { ConfigMapModel } from '@console/internal/models';
import { referenceForModel, K8sKind, k8sPatch } from '@console/internal/module/k8s';
import { withFallback } from '@console/shared/src/components/error';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DEFAULT_SOURCE_NAMESPACE } from '../const';
import {
  SubscriptionModel,
  CatalogSourceModel,
  PackageManifestModel,
  OperatorGroupModel,
  OperatorHubModel,
} from '../models';
import { CatalogSourceKind, PackageManifestKind, OperatorGroupKind } from '../types';
import useOperatorHubConfig from '../utils/useOperatorHubConfig';
import { deleteCatalogSourceModal } from './modals/delete-catalog-source-modal';
import { disableDefaultSourceModal } from './modals/disable-default-source-modal';
import { requireOperatorGroup } from './operator-group';
import { OperatorHubKind } from './operator-hub';
import { PackageManifestsPage } from './package-manifest';
import { RegistryPollIntervalDetailItem } from './registry-poll-interval-details';

const catalogSourceModelReference = referenceForModel(CatalogSourceModel);

const deleteModal = (kind: K8sKind, catalogSource: CatalogSourceKind): KebabOption => ({
  ...Kebab.factory.Delete(kind, catalogSource),
  callback: () => deleteCatalogSourceModal({ kind, resource: catalogSource }),
});

const disableSourceModal = (
  kind: K8sKind,
  operatorHub: OperatorHubKind,
  sourceName: string,
): KebabOption => ({
  // t('olm~Disable')
  labelKey: 'olm~Disable',
  callback: () => disableDefaultSourceModal({ kind, operatorHub, sourceName }),
  accessReview: asAccessReview(kind, operatorHub, 'patch'),
});

const enableSource = (
  kind: K8sKind,
  operatorHub: OperatorHubKind,
  sourceName: string,
): KebabOption => ({
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

const DefaultSourceKebab: React.FC<DefaultSourceKebabProps> = ({
  kind,
  operatorHub,
  sourceName,
  sourceDisabled,
  source,
}) => {
  const options = sourceDisabled
    ? [enableSource(kind, operatorHub, sourceName)]
    : [
        disableSourceModal(kind, operatorHub, sourceName),
        ...(source ? [Kebab.factory.Edit(CatalogSourceModel, source)] : []),
      ];
  return <Kebab options={options} />;
};

const getOperatorCount = (
  catalogSource: CatalogSourceKind,
  packageManifests: PackageManifestKind[],
): number =>
  packageManifests.filter(
    (p) =>
      p.status?.catalogSource === catalogSource.metadata.name &&
      p.status?.catalogSourceNamespace === catalogSource.metadata.namespace,
  ).length;

const getEndpoint = (catalogSource: CatalogSourceKind): React.ReactNode => {
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

export const CatalogSourceDetails: React.FC<CatalogSourceDetailsProps> = ({
  obj: catalogSource,
  packageManifests,
}) => {
  const { t } = useTranslation();

  const operatorCount = getOperatorCount(catalogSource, packageManifests);

  const catsrcNamespace =
    catalogSource.metadata.namespace === DEFAULT_SOURCE_NAMESPACE
      ? 'Cluster wide'
      : catalogSource.metadata.namespace;

  return !_.isEmpty(catalogSource) ? (
    <PaneBody>
      <SectionHeading
        text={t('olm~CatalogSource details', {
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
              label={t('public~Status')}
              obj={catalogSource}
              path="status.connectionState.lastObservedState"
            />
            <DetailsItem
              label={t('public~Display name')}
              obj={catalogSource}
              path="spec.displayName"
            />
            <DetailsItem label={t('olm~Publisher')} obj={catalogSource} path="spec.publisher" />
            <DetailsItem
              label={t('olm~Availability')}
              obj={catalogSource}
              description={t(
                'olm~Denotes whether this CatalogSource provides operators to a specific namespace, or the entire cluster.',
              )}
            >
              {catsrcNamespace}
            </DetailsItem>
            <DetailsItem
              label="Endpoint"
              obj={catalogSource}
              description={t(
                "olm~The ConfigMap, image, or address for this CatalogSource's registry.",
              )}
            >
              {getEndpoint(catalogSource)}
            </DetailsItem>
            <RegistryPollIntervalDetailItem catalogSource={catalogSource} />
            <DetailsItem
              label={t('olm~Number of Operators')}
              obj={catalogSource}
              description={t('olm~The number of packages this CatalogSource provides.')}
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

export const CatalogSourceOperatorsPage: React.FC<CatalogSourceOperatorsPageProps> = (props) => {
  return <PackageManifestsPage catalogSource={props.obj} showTitle={false} {...props} />;
};

export const CatalogSourceDetailsPage: React.FC = (props) => {
  const [operatorHub, operatorHubLoaded, operatorHubLoadError] = useOperatorHubConfig();
  const params = useParams();

  const isDefaultSource = React.useMemo(
    () =>
      DEFAULT_SOURCE_NAMESPACE === params.ns &&
      operatorHub?.status?.sources?.some((source) => source.name === params.name),
    [operatorHub, params.name, params.ns],
  );

  const menuActions = isDefaultSource
    ? [Kebab.factory.Edit, () => disableSourceModal(OperatorHubModel, operatorHub, params.name)]
    : Kebab.factory.common;

  return (
    <DetailsPage
      {...props}
      namespace={params.ns}
      kind={referenceForModel(CatalogSourceModel)}
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
      menuActions={operatorHubLoaded && !operatorHubLoadError ? menuActions : []}
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

export const CreateSubscriptionYAML: React.FC = (props) => {
  type CreateProps = {
    packageManifest: { loaded: boolean; data?: PackageManifestKind };
    operatorGroup: { loaded: boolean; data?: OperatorGroupKind[] };
  };
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
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
            source: ${new URLSearchParams(location.search).get('catalog')}
            sourceNamespace: ${new URLSearchParams(location.search).get('catalogNamespace')}
            name: ${pkg.metadata.name}
            startingCSV: ${channel.currentCSV}
            channel: ${channel.name}
        `;
          return (
            <CreateYAML {...(props as any)} plural={SubscriptionModel.plural} template={template} />
          );
        }
        return <LoadingBox />;
      },
      () => (
        <ConsoleEmptyState title={t('olm~Package not found')}>
          {t('olm~Cannot create a Subscription to a non-existent package.')}
        </ConsoleEmptyState>
      ),
    ),
  );

  return (
    <Firehose
      resources={[
        {
          kind: referenceForModel(PackageManifestModel),
          isList: false,
          name: new URLSearchParams(location.search).get('pkg'),
          namespace: new URLSearchParams(location.search).get('catalogNamespace'),
          prop: 'packageManifest',
        },
        {
          kind: referenceForModel(OperatorGroupModel),
          isList: true,
          namespace: params.ns,
          prop: 'operatorGroup',
        },
      ]}
    >
      {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
      <Create {...(props as any)} />
    </Firehose>
  );
};

const tableColumnClasses = [
  '',
  css('pf-m-hidden', 'pf-m-visible-on-sm'),
  '',
  css('pf-m-hidden', 'pf-m-visible-on-lg'),
  css('pf-m-hidden', 'pf-m-visible-on-xl'),
  css('pf-m-hidden', 'pf-m-visible-on-xl'),
  css('pf-m-hidden', 'pf-m-visible-on-lg'),
  Kebab.columnClass,
];

const getRowProps = (obj) => ({
  className: obj?.disabled ? 'catalog-source__table-row--disabled' : undefined,
});

const CatalogSourceTableRow: React.FC<RowFunctionArgs<CatalogSourceTableRowObj>> = ({
  obj: {
    availability = '-',
    disabled = false,
    endpoint = '-',
    isDefault = false,
    name,
    operatorCount = 0,
    operatorHub,
    publisher = '-',
    registryPollInterval = '-',
    status = '',
    source,
  },
}) => (
  <>
    <TableData className={tableColumnClasses[0]}>
      {source ? (
        <ResourceLink
          kind={catalogSourceModelReference}
          name={source.metadata.name}
          namespace={source.metadata.namespace}
        />
      ) : (
        name
      )}
    </TableData>
    <TableData className={tableColumnClasses[1]} data-test={`${source?.metadata.name}-status`}>
      {status}
    </TableData>
    <TableData className={tableColumnClasses[2]}>{publisher}</TableData>
    <TableData className={tableColumnClasses[3]}>{availability}</TableData>
    <TableData className={tableColumnClasses[4]}>{endpoint}</TableData>
    <TableData className={tableColumnClasses[5]}>{registryPollInterval}</TableData>
    <TableData className={tableColumnClasses[6]}>{operatorCount || '-'}</TableData>
    <TableData className={tableColumnClasses[7]}>
      {isDefault ? (
        <DefaultSourceKebab
          kind={OperatorHubModel}
          operatorHub={operatorHub}
          sourceName={name}
          sourceDisabled={disabled}
          source={source}
        />
      ) : (
        <ResourceKebab
          actions={[
            Kebab.factory.ModifyLabels,
            Kebab.factory.ModifyAnnotations,
            Kebab.factory.Edit,
            deleteModal,
          ]}
          kind={catalogSourceModelReference}
          resource={source}
        />
      )}
    </TableData>
  </>
);

const CatalogSourceList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();
  const CatalogSourceHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Status'),
        sortField: 'status',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('olm~Publisher'),
        sortField: 'publisher',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('olm~Availability'),
        sortField: 'availabilitySort',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('olm~Endpoint'),
        sortField: 'endpoint',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: t('olm~Registry poll interval'),
        sortField: 'registryPollInterval',
        transforms: [sortable],
        props: { className: tableColumnClasses[5] },
      },
      {
        title: t('olm~# of Operators'),
        sortField: 'operatorCount',
        transforms: [sortable],
        props: { className: tableColumnClasses[6] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[7] },
      },
    ];
  };
  return (
    <Table
      {...props}
      aria-label={`${CatalogSourceModel.labelPlural}`}
      Header={CatalogSourceHeader}
      Row={CatalogSourceTableRow}
      getRowProps={getRowProps}
    />
  );
};

const DisabledPopover: React.FC<DisabledPopoverProps> = ({ operatorHub, sourceName }) => {
  const [visible, setVisible] = React.useState<boolean>(null);
  const close = React.useCallback(() => {
    setVisible(false);
  }, []);
  const onClickEnable = React.useCallback(
    () => enableSource(OperatorHubModel, operatorHub, sourceName).callback().then(close),
    [close, operatorHub, sourceName],
  );
  const { t } = useTranslation();
  return (
    <PopoverStatus
      title={t('olm~Disabled')}
      isVisible={visible}
      shouldClose={close}
      statusBody={<StatusIconAndText title={t('olm~Disabled')} />}
    >
      <p>
        {t(
          'olm~Operators provided by this source will not appear in OperatorHub and any operators installed from this source will not receive updates until this source is re-enabled.',
        )}
      </p>
      <Button isInline variant="link" onClick={onClickEnable}>
        {t('olm~Enable source')}
      </Button>
    </PopoverStatus>
  );
};

const getRegistryPollInterval = (catalogSource: CatalogSourceKind): string => {
  return catalogSource.spec?.updateStrategy?.registryPoll?.interval;
};

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

export const CatalogSourceListPage: React.FC<CatalogSourceListPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <MultiListPage
      {...props}
      canCreate
      createAccessReview={{ model: CatalogSourceModel }}
      createButtonText={t('olm~Create CatalogSource')}
      createProps={{ to: `/k8s/cluster/${referenceForModel(CatalogSourceModel)}/~new` }}
      flatten={(data) => flatten({ operatorHub: props.obj, ...data })}
      ListComponent={CatalogSourceList}
      textFilter="catalog-source-name"
      hideLabelFilter
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

type CatalogSourceTableRowObj = {
  availability: React.ReactNode;
  disabled?: boolean;
  endpoint?: React.ReactNode;
  isDefault?: boolean;
  name: string;
  namespace: string;
  operatorCount?: number;
  operatorHub: OperatorHubKind;
  publisher?: string;
  registryPollInterval?: string;
  status?: string;
  source?: CatalogSourceKind;
};

type DefaultSourceKebabProps = {
  kind: K8sKind;
  operatorHub: OperatorHubKind;
  sourceName: string;
  sourceDisabled: boolean;
  source?: CatalogSourceKind;
};

type DisabledPopoverProps = {
  operatorHub: OperatorHubKind;
  sourceName: string;
};

type FlattenArgType = {
  catalogSources?: FirehoseResult<CatalogSourceKind[]>;
  packageManifests?: FirehoseResult<PackageManifestKind[]>;
  operatorHub: OperatorHubKind;
};

export type CatalogSourceDetailsProps = {
  obj: CatalogSourceKind;
  packageManifests: PackageManifestKind[];
};

export type CatalogSourceListPageProps = {
  obj: OperatorHubKind;
} & MultiListPageProps;

export type CatalogSourceOperatorsPageProps = {
  obj: CatalogSourceKind;
} & MultiListPageProps;

CatalogSourceDetails.displayName = 'CatalogSourceDetails';
CatalogSourceDetailsPage.displayName = 'CatalogSourceDetailPage';
CreateSubscriptionYAML.displayName = 'CreateSubscriptionYAML';
