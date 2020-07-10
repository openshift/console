import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { match } from 'react-router-dom';
import { CreateYAML } from '@console/internal/components/create-yaml';
import { ListPageProps } from '@console/internal/components/monitoring/types';
import { sortable } from '@patternfly/react-table';
import { Button } from '@patternfly/react-core';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import {
  K8sResourceKind,
  referenceForModel,
  K8sKind,
  k8sPatch,
} from '@console/internal/module/k8s';
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
} from '@console/internal/components/utils';
import {
  DetailsPage,
  Table,
  TableRow,
  TableData,
  TableProps,
  MultiListPage,
  RowFunction,
} from '@console/internal/components/factory';
import { ConfigMapModel } from '@console/internal/models';
import { PopoverStatus, StatusIconAndText } from '@console/shared';
import {
  SubscriptionModel,
  CatalogSourceModel,
  PackageManifestModel,
  OperatorGroupModel,
  OperatorHubModel,
} from '../models';
import {
  CatalogSourceKind,
  SubscriptionKind,
  PackageManifestKind,
  OperatorGroupKind,
} from '../types';
import { requireOperatorGroup } from './operator-group';
import { PackageManifestList } from './package-manifest';
import { deleteCatalogSourceModal } from './modals/delete-catalog-source-modal';
import { disableDefaultSourceModal } from './modals/disable-default-source-modal';
import { OperatorHubKind } from './operator-hub';

const DEFAULT_SOURCE_NAMESPACE = 'openshift-marketplace';
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
  label: 'Disable',
  callback: () => disableDefaultSourceModal({ kind, operatorHub, sourceName }),
  accessReview: asAccessReview(kind, operatorHub, 'patch'),
});

const enableSource = (
  kind: K8sKind,
  operatorHub: OperatorHubKind,
  sourceName: string,
): KebabOption => ({
  label: 'Enable',
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
}) => {
  const options = sourceDisabled
    ? [enableSource(kind, operatorHub, sourceName)]
    : [disableSourceModal(kind, operatorHub, sourceName)];
  return <Kebab options={options} />;
};

export const CatalogSourceDetails: React.SFC<CatalogSourceDetailsProps> = ({
  obj,
  packageManifests,
  subscriptions,
  operatorGroups,
}) => {
  const toData = <T extends K8sResourceKind>(data: T[]) => ({ loaded: true, data });

  return !_.isEmpty(obj) ? (
    <div className="co-catalog-details co-m-pane">
      <div className="co-m-pane__body">
        <div className="col-xs-4">
          <dl className="co-m-pane__details">
            <dt>Name</dt>
            <dd>{obj.spec.displayName}</dd>
          </dl>
        </div>
        <div className="col-xs-4">
          <dl className="co-m-pane__details">
            <dt>Publisher</dt>
            <dd>{obj.spec.publisher}</dd>
          </dl>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Packages" />
        <PackageManifestList
          loaded
          data={packageManifests}
          operatorGroup={toData(operatorGroups)}
          subscription={toData(subscriptions)}
        />
      </div>
    </div>
  ) : (
    <div />
  );
};

export const CatalogSourceDetailsPage: React.SFC<CatalogSourceDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    namespace={props.match.params.ns}
    kind={referenceForModel(CatalogSourceModel)}
    name={props.match.params.name}
    pages={[navFactory.details(CatalogSourceDetails), navFactory.editYaml()]}
    menuActions={Kebab.factory.common}
    resources={[
      {
        kind: referenceForModel(PackageManifestModel),
        isList: true,
        namespace: props.match.params.ns,
        selector: { matchLabels: { catalog: props.match.params.name } },
        prop: 'packageManifests',
      },
      {
        kind: referenceForModel(SubscriptionModel),
        isList: true,
        namespace: props.match.params.ns,
        prop: 'subscriptions',
      },
      {
        kind: referenceForModel(OperatorGroupModel),
        isList: true,
        namespace: props.match.params.ns,
        prop: 'operatorGroups',
      },
    ]}
  />
);

export const CreateSubscriptionYAML: React.SFC<CreateSubscriptionYAMLProps> = (props) => {
  type CreateProps = {
    packageManifest: { loaded: boolean; data?: PackageManifestKind };
    operatorGroup: { loaded: boolean; data?: OperatorGroupKind[] };
  };
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
          title="Package Not Found"
          detail="Cannot create a Subscription to a non-existent package."
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
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const CatalogSourceHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Publisher',
      sortField: 'publisher',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Availability',
      sortField: 'availabilitySort',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Endpoint',
      sortField: 'endpoint',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '# of Operators',
      sortField: 'operatorCount',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};

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

const getOperatorCount = (
  catalogSource: CatalogSourceKind,
  packageManifests: PackageManifestKind[],
): number =>
  _.filter(packageManifests, {
    status: {
      catalogSource: catalogSource.metadata.name,
      catalogSourceNamespace: catalogSource.metadata.namespace,
    },
  } as any).length; // Type inferred to prevent Lodash TypeScript error.

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
          title={source.metadata.name}
        />
      ) : (
        name
      )}
    </TableData>
    <TableData className={tableColumnClasses[1]}>{publisher}</TableData>
    <TableData className={tableColumnClasses[2]}>{availability}</TableData>
    <TableData className={tableColumnClasses[3]}>{endpoint}</TableData>
    <TableData className={tableColumnClasses[4]}>{operatorCount || '-'}</TableData>
    <TableData className={tableColumnClasses[5]}>
      {isDefault ? (
        <DefaultSourceKebab
          kind={OperatorHubModel}
          operatorHub={operatorHub}
          sourceName={name}
          sourceDisabled={disabled}
        />
      ) : (
        <ResourceKebab
          actions={[Kebab.factory.Edit, deleteModal]}
          kind={catalogSourceModelReference}
          resource={source}
        />
      )}
    </TableData>
  </TableRow>
);

const CatalogSourceList: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label="Catalog Sources"
    Header={CatalogSourceHeader}
    Row={CatalogSourceTableRow}
  />
);

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
  return (
    <PopoverStatus
      title="Disabled"
      isVisible={visible}
      shouldClose={close}
      statusBody={<StatusIconAndText title="Disabled" />}
    >
      <p>
        Operators provided by this source will not appear in OperatorHub and any operators installed
        from this source will not receive updates until this source is re-enabled.
      </p>
      <Button isInline variant="link" onClick={onClickEnable}>
        Enable source
      </Button>
    </PopoverStatus>
  );
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
          'Cluster wide'
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
        }),
      };
    },
  );

  const customSources: CatalogSourceTableRowObj[] = _.map(catalogSources.data, (source) => ({
    availability:
      source.metadata.namespace === DEFAULT_SOURCE_NAMESPACE
        ? 'Cluster wide'
        : source.metadata.namespace,
    endpoint: getEndpoint(source),
    name: source.metadata.name,
    namespace: source.metadata.namespace,
    operatorCount: getOperatorCount(source, packageManifests.data),
    operatorHub,
    publisher: source.spec.publisher,
    source,
  }));

  return _.unionWith(
    defaultSources,
    customSources,
    (a, b) => a.name === b.name && a.namespace === b.namespace,
  );
};

export const CatalogSourceListPage: React.FC<CatalogSourceListPageProps> = (props) => (
  <MultiListPage
    {...props}
    canCreate
    createAccessReview={{ model: CatalogSourceModel }}
    createButtonText="Create Catalog Source"
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

type CatalogSourceTableRowObj = {
  availability: React.ReactNode;
  disabled?: boolean;
  endpoint?: React.ReactNode;
  isDefault?: boolean;
  name: string;
  namespace: string;
  publisher?: string;
  operatorCount?: number;
  operatorHub: OperatorHubKind;
  source?: CatalogSourceKind;
};

type DefaultSourceKebabProps = {
  kind: K8sKind;
  operatorHub: OperatorHubKind;
  sourceName: string;
  sourceDisabled: boolean;
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
  subscriptions: SubscriptionKind[];
  packageManifests: PackageManifestKind[];
  operatorGroups: OperatorGroupKind[];
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

CatalogSourceDetails.displayName = 'CatalogSourceDetails';
CatalogSourceDetailsPage.displayName = 'CatalogSourceDetailPage';
CreateSubscriptionYAML.displayName = 'CreateSubscriptionYAML';
