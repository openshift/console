import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { match } from 'react-router-dom';
import { CreateYAML } from '@console/internal/components/create-yaml';
import {
  DetailsPage,
  Table,
  TableRow,
  TableData,
  TableProps,
  MultiListPage,
  RowFunction,
} from '@console/internal/components/factory';
import { ListPageProps } from '@console/internal/components/monitoring/types';
import {
  Firehose,
  Kebab,
  LoadingBox,
  MsgBox,
  navFactory,
  ResourceKebab,
  ResourceLink,
  SectionHeading,
  asAccessReview,
  KebabOption,
  ResourceSummary,
  DetailsItem,
} from '@console/internal/components/utils';
import i18n from '@console/internal/i18n';
import { ConfigMapModel } from '@console/internal/models';
import {
  K8sResourceKind,
  referenceForModel,
  K8sKind,
  k8sPatch,
} from '@console/internal/module/k8s';
import { PopoverStatus, StatusIconAndText } from '@console/shared';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
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
import { editRegitryPollInterval } from './modals/edit-registry-poll-interval-modal';
import { requireOperatorGroup } from './operator-group';
import { OperatorHubKind } from './operator-hub';
import { PackageManifestsPage } from './package-manifest';

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
    <div className="co-m-pane__body">
      <SectionHeading
        text={t('olm~CatalogSource details', {
          resource: CatalogSourceModel.label,
        })}
      />
      <div className="row">
        <div className="col-sm-6 col-xs-12">
          <ResourceSummary resource={catalogSource} />
        </div>
        <div className="col-sm-6 col-xs-12">
          <div className="co-m-pane__body">
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
            <DetailsItem
              label={t('olm~Registry poll interval')}
              obj={catalogSource}
              path="spec.updateStrategy.registryPoll.interval"
              canEdit={!_.isEmpty(catalogSource.spec.updateStrategy)}
              onEdit={() => editRegitryPollInterval({ catalogSource })}
            />
            <DetailsItem
              label={t('olm~Number of Operators')}
              obj={catalogSource}
              description={t('olm~The number of packages this CatalogSource provides.')}
            >
              {operatorCount}
            </DetailsItem>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div />
  );
};

export const CatalogSourceOperatorsPage: React.FC<CatalogSourceOperatorsPageProps> = (props) => {
  return <PackageManifestsPage catalogSource={props.obj} showTitle={false} {...props} />;
};

export const CatalogSourceDetailsPage: React.FC<CatalogSourceDetailsPageProps> = (props) => {
  const [operatorHub, operatorHubLoaded, operatorHubLoadError] = useOperatorHubConfig();

  const isDefaultSource = React.useMemo(
    () =>
      DEFAULT_SOURCE_NAMESPACE === props.match.params.ns &&
      operatorHub?.status?.sources?.some((source) => source.name === props.match.params.name),
    [operatorHub, props.match.params.name, props.match.params.ns],
  );

  const menuActions = isDefaultSource
    ? [
        Kebab.factory.Edit,
        () => disableSourceModal(OperatorHubModel, operatorHub, props.match.params.name),
      ]
    : Kebab.factory.common;

  return (
    <DetailsPage
      {...props}
      namespace={props.match.params.ns}
      kind={referenceForModel(CatalogSourceModel)}
      name={props.match.params.name}
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
          namespace: props.match.params.ns,
          prop: 'packageManifests',
        },
      ]}
    />
  );
};

export const CreateSubscriptionYAML: React.FC<CreateSubscriptionYAMLProps> = (props) => {
  type CreateProps = {
    packageManifest: { loaded: boolean; data?: PackageManifestKind };
    operatorGroup: { loaded: boolean; data?: OperatorGroupKind[] };
  };
  const { t } = useTranslation();
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
            source: ${new URLSearchParams(props.location.search).get('catalog')}
            sourceNamespace: ${new URLSearchParams(props.location.search).get('catalogNamespace')}
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
        <MsgBox
          title={t('olm~Package not found')}
          detail={t('olm~Cannot create a Subscription to a non-existent package.')}
        />
      ),
    ),
  );

  return (
    <Firehose
      resources={[
        {
          kind: referenceForModel(PackageManifestModel),
          isList: false,
          name: new URLSearchParams(props.location.search).get('pkg'),
          namespace: new URLSearchParams(props.location.search).get('catalogNamespace'),
          prop: 'packageManifest',
        },
        {
          kind: referenceForModel(OperatorGroupModel),
          isList: true,
          namespace: props.match.params.ns,
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
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  Kebab.columnClass,
];

const CatalogSourceTableRow: RowFunction<CatalogSourceTableRowObj> = ({
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
  index,
  key,
  style,
}) => (
  <TableRow
    className={disabled && 'catalog-source__table-row--disabled'}
    id={source ? source.metadata.uid : index}
    index={index}
    style={style}
    trKey={key}
  >
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
  </TableRow>
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
    />
  );
};

const DisabledPopover: React.FC<DisabledPopoverProps> = ({ operatorHub, sourceName }) => {
  const [visible, setVisible] = React.useState<boolean>(null);
  const close = React.useCallback(() => {
    setVisible(false);
  }, []);
  const onClickEnable = React.useCallback(
    () =>
      enableSource(OperatorHubModel, operatorHub, sourceName)
        .callback()
        .then(close),
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
    operatorHub.status.sources,
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
  catalogSources: { data: CatalogSourceKind[] };
  packageManifests: { data: PackageManifestKind[] };
  operatorHub: OperatorHubKind;
};

export type CatalogSourceDetailsProps = {
  obj: CatalogSourceKind;
  packageManifests: PackageManifestKind[];
};

export type CatalogSourceDetailsPageProps = {
  match: match<{ ns?: string; name: string }>;
};

export type CatalogSourceListPageProps = {
  obj: K8sResourceKind;
} & ListPageProps;

export type CreateSubscriptionYAMLProps = {
  match: match<{ ns: string; pkgName: string }>;
  location: Location;
};

export type CatalogSourceOperatorsPageProps = {
  obj: CatalogSourceKind;
} & ListPageProps;

CatalogSourceDetails.displayName = 'CatalogSourceDetails';
CatalogSourceDetailsPage.displayName = 'CatalogSourceDetailPage';
CreateSubscriptionYAML.displayName = 'CreateSubscriptionYAML';
