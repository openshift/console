import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import {
  sortable,
  SortByDirection,
  Table as PFTable,
  TableBody,
  TableHeader,
  TableVariant,
} from '@patternfly/react-table';
import { BanIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
import {
  AsyncComponent,
  DetailsItem,
  EmptyBox,
  Kebab,
  KebabAction,
  LoadingBox,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from './utils';
import {
  apiVersionCompare,
  CRDVersion,
  CustomResourceDefinitionKind,
  getLatestVersionForCRD,
  K8sKind,
  referenceForCRD,
} from '../module/k8s';
import { CustomResourceDefinitionModel } from '../models';
import { Conditions } from './conditions';
import { getResourceListPages } from './resource-pages';
import { DefaultPage } from './default-resource';
import { GreenCheckCircleIcon } from '@console/shared';
import { useExtensions, isResourceListPage, ResourceListPage } from '@console/plugin-sdk';
import {
  ResourceListPage as DynamicResourceListPage,
  isResourceListPage as isDynamicResourceListPage,
} from '@console/dynamic-plugin-sdk';
const { common } = Kebab.factory;

const crdInstancesPath = (crd: CustomResourceDefinitionKind) =>
  _.get(crd, 'spec.scope') === 'Namespaced'
    ? `/k8s/all-namespaces/${referenceForCRD(crd)}`
    : `/k8s/cluster/${referenceForCRD(crd)}`;

const instances = (kind: K8sKind, obj: CustomResourceDefinitionKind) => ({
  // t('public~View instances')
  labelKey: 'public~View instances',
  href: crdInstancesPath(obj),
});

const menuActions: KebabAction[] = [
  instances,
  ...Kebab.getExtensionsActionsForKind(CustomResourceDefinitionModel),
  ...common,
];

const tableColumnClasses = [
  'pf-m-u-w-33-on-md pf-u-w-25-on-lg',
  'pf-m-u-w-33-on-md pf-u-w-25-on-lg',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-xl',
  Kebab.columnClass,
];

const isEstablished = (conditions: any[]) => {
  const condition = _.find(conditions, (c) => c.type === 'Established');
  return condition && condition.status === 'True';
};

const namespaced = (crd: CustomResourceDefinitionKind) => crd.spec.scope === 'Namespaced';

const Established: React.FC<{ crd: CustomResourceDefinitionKind }> = ({ crd }) => {
  const { t } = useTranslation();
  return crd.status && isEstablished(crd.status.conditions) ? (
    <span>
      <GreenCheckCircleIcon title={t('public~true')} />
    </span>
  ) : (
    <span>
      <BanIcon title={t('public~false')} />
    </span>
  );
};

const EmptyVersionsMsg: React.FC<{}> = () => {
  const { t } = useTranslation();
  return <EmptyBox label={t('public~CRD versions')} />;
};

const CRDVersionTable: React.FC<CRDVersionProps> = ({ versions }) => {
  const [sortBy, setSortBy] = React.useState<PFSortState>({});

  const compare = (a, b) => {
    const aVal = a?.[sortBy.index] ?? '';
    const bVal = b?.[sortBy.index] ?? '';
    return sortBy.index === 0 ? apiVersionCompare(aVal, bVal) : aVal.localeCompare(bVal);
  };

  const versionRows = _.map(versions, (version: CRDVersion) => [
    version.name,
    version.served.toString(),
    version.storage.toString(),
  ]);

  sortBy.direction === SortByDirection.asc
    ? versionRows.sort(compare)
    : versionRows.sort(compare).reverse();

  const onSort = (_event, index, direction) => {
    setSortBy({ index, direction });
  };

  const { t } = useTranslation();
  const crdVersionTableHeaders = [
    {
      title: t('public~Name'),
      transforms: [sortable],
    },
    {
      title: t('public~Served'),
      transforms: [sortable],
    },
    {
      title: t('public~Storage'),
      transforms: [sortable],
    },
  ];

  return versionRows.length > 0 ? (
    <PFTable
      variant={TableVariant.compact}
      aria-label={t('public~CRD versions')}
      cells={crdVersionTableHeaders}
      rows={versionRows}
      onSort={onSort}
      sortBy={sortBy}
    >
      <TableHeader />
      <TableBody />
    </PFTable>
  ) : (
    <EmptyVersionsMsg />
  );
};

const Details: React.FC<{ obj: CustomResourceDefinitionKind }> = ({ obj: crd }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~CustomResourceDefinition details')} />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary showPodSelector={false} showNodeSelector={false} resource={crd} />
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <dt>{t('public~Established')}</dt>
                <dd>
                  <Established crd={crd} />
                </dd>
                <DetailsItem label={t('public~Group')} obj={crd} path="spec.group" />
                <dt>{t('public~Latest version')}</dt>
                <dd>{getLatestVersionForCRD(crd)}</dd>
                <DetailsItem label={t('public~Scope')} obj={crd} path="spec.scope" />
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={crd.status.conditions} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Versions')} />
        <CRDVersionTable versions={crd.spec.versions} />
      </div>
    </>
  );
};

const Instances: React.FC<InstancesProps> = ({ obj, namespace }) => {
  const resourceListPageExtensions = useExtensions<ResourceListPage>(isResourceListPage);
  const dynamicResourceListPageExtensions = useExtensions<DynamicResourceListPage>(
    isDynamicResourceListPage,
  );
  const crdKind = referenceForCRD(obj);
  const componentLoader = getResourceListPages(
    resourceListPageExtensions,
    dynamicResourceListPageExtensions,
  ).get(crdKind, () => Promise.resolve(DefaultPage));
  return (
    <AsyncComponent
      loader={componentLoader}
      namespace={namespace ? namespace : undefined}
      kind={crdKind}
      showTitle={false}
      autoFocus={false}
    />
  );
};

export const CustomResourceDefinitionsList: React.FC<CustomResourceDefinitionsListProps> = (
  props,
) => {
  const { t } = useTranslation();
  const CRDTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'spec.names.kind',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Group'),
        sortField: 'spec.group',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('public~Latest version'),
        sortFunc: 'crdLatestVersion',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Namespaced'),
        sortField: 'spec.scope',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('public~Established'),
        props: { className: tableColumnClasses[4] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[5] },
      },
    ];
  };
  const CRDTableRow: React.FC<RowFunctionArgs<CustomResourceDefinitionKind>> = ({ obj: crd }) => {
    return (
      <>
        <TableData className={tableColumnClasses[0]}>
          <span className="co-resource-item">
            <ResourceLink
              kind="CustomResourceDefinition"
              name={crd.metadata.name}
              namespace={crd.metadata.namespace}
              displayName={_.get(crd, 'spec.names.kind')}
            />
          </span>
        </TableData>
        <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
          {crd.spec.group}
        </TableData>
        <TableData className={tableColumnClasses[2]}>{getLatestVersionForCRD(crd)}</TableData>
        <TableData className={tableColumnClasses[3]}>
          {namespaced(crd) ? t('public~Yes') : t('public~No')}
        </TableData>
        <TableData className={tableColumnClasses[4]}>
          <Established crd={crd} />
        </TableData>
        <TableData className={tableColumnClasses[5]}>
          <ResourceKebab actions={menuActions} kind="CustomResourceDefinition" resource={crd} />
        </TableData>
      </>
    );
  };

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <Table
        {...props}
        aria-label={CustomResourceDefinitionModel.label}
        Header={CRDTableHeader}
        Row={CRDTableRow}
        defaultSortField="spec.names.kind"
        virtualize
      />
    </React.Suspense>
  );
};

export const CustomResourceDefinitionsPage: React.FC<CustomResourceDefinitionsPageProps> = (
  props,
) => (
  <ListPage
    {...props}
    ListComponent={CustomResourceDefinitionsList}
    kind="CustomResourceDefinition"
    canCreate={true}
    textFilter="custom-resource-definition-name"
  />
);
export const CustomResourceDefinitionsDetailsPage: React.FC<CustomResourceDefinitionsDetailsPageProps> = (
  props,
) => {
  const { t } = useTranslation();
  return (
    <DetailsPage
      {...props}
      kind="CustomResourceDefinition"
      menuActions={menuActions}
      pages={[
        navFactory.details(Details),
        navFactory.editYaml(),
        {
          name: t('public~Instances'),
          href: 'instances',
          component: Instances,
        },
      ]}
    />
  );
};

export type CustomResourceDefinitionsListProps = {};

export type CustomResourceDefinitionsPageProps = {};

type InstancesProps = {
  obj: CustomResourceDefinitionKind;
  namespace: string;
};

CustomResourceDefinitionsList.displayName = 'CustomResourceDefinitionsList';
CustomResourceDefinitionsPage.displayName = 'CustomResourceDefinitionsPage';

type CustomResourceDefinitionsDetailsPageProps = {
  match: any;
};

export type CRDVersionProps = {
  versions: CRDVersion[];
};

type PFSortState = {
  index?: number;
  direction?: SortByDirection;
};
