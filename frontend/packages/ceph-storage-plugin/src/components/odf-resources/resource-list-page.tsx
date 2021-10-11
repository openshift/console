import * as React from 'react';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  Kebab,
  LabelList,
  Timestamp,
  ResourceKebab,
  KebabAction,
} from '@console/internal/components/utils';
import { OperandStatus } from '@console/operator-lifecycle-manager/src/components/operand';
import {
  referenceFor,
  K8sResourceCommon,
  referenceForModel,
  FirehoseResourcesResult,
} from '@console/internal/module/k8s';
import {
  TableData,
  Table,
  ListPage,
  Flatten,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import { sortable } from '@patternfly/react-table';
import { RowFilter, ColumnLayout } from '@console/dynamic-plugin-sdk';
import ODFResourceLink from './link';
import {
  NooBaaBackingStoreModel,
  NooBaaBucketClassModel,
  NooBaaNamespaceStoreModel,
} from '../../models';
import { editBucketClass } from '../bucket-class/modals/edit-backingstore-modal';

const tableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'),
  Kebab.columnClass,
];

type CustomRowData = {
  resourceKind: string;
  actions?: KebabAction[];
};

const Row: React.FC<RowFunctionArgs<K8sResourceCommon, CustomRowData>> = ({
  obj,
  customData: { resourceKind, actions = [] },
}) => {
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ODFResourceLink kind={resourceKind} name={obj?.metadata?.name} />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        data-test-operand-kind={obj.kind}
      >
        {obj.kind}
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <OperandStatus operand={obj} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <LabelList kind={obj.kind} labels={obj.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab
          actions={[...actions, ...Kebab.factory.common]}
          kind={referenceFor(obj)}
          resource={obj}
        />
      </TableData>
    </>
  );
};

const ResourceTable: React.FC<ResourceListProps> = (props) => {
  const { t } = useTranslation();
  const Header = () => {
    return [
      {
        title: t('ceph-storage-plugin~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('ceph-storage-plugin~Kind'),
        sortField: 'kind',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('ceph-storage-plugin~Status'),
        sortFunc: 'operandStatus',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('ceph-storage-plugin~Labels'),
        sortField: 'metadata.labels',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('ceph-storage-plugin~Last updated'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[5] },
      },
    ];
  };

  return (
    <Table
      {...props}
      aria-label={t('ceph-storage-plugin~Storage Systems')}
      Header={Header}
      Row={Row}
      virtualize
    />
  );
};

type GenericListPageProps = {
  resourceKind: string;
  actions?: KebabAction[];
};

const GenericListPage: React.FC<GenericListPageProps> = (props) => {
  const { resourceKind, actions } = props;
  const createProps = {
    to: `/odf/resource/${resourceKind}/create/~new`,
  };
  const customData = React.useMemo(
    () => ({
      resourceKind,
      actions,
    }),
    [resourceKind, actions],
  );
  return (
    <ListPage
      {...props}
      showTitle={false}
      ListComponent={ResourceTable}
      kind={resourceKind}
      canCreate
      createProps={createProps}
      customData={customData}
    />
  );
};

export const BackingStoreListPage: React.FC = () => (
  <GenericListPage resourceKind={referenceForModel(NooBaaBackingStoreModel)} />
);

export const BucketClassListPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <GenericListPage
      resourceKind={referenceForModel(NooBaaBucketClassModel)}
      actions={[editBucketClass(t)]}
    />
  );
};

export const NamespaceStoreListPage: React.FC = () => (
  <GenericListPage resourceKind={referenceForModel(NooBaaNamespaceStoreModel)} />
);

type ResourceListProps = {
  ListComponent: React.ComponentType;
  kinds: string[];
  filters?: any;
  flatten?: Flatten;
  rowFilters?: RowFilter[];
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  columnLayout?: ColumnLayout;
  name?: string;
  resources?: FirehoseResourcesResult;
  reduxIDs?: string[];
  textFilter?: string;
  nameFilterPlaceholder?: string;
  labelFilterPlaceholder?: string;
  label?: string;
  staticFilters?: { key: string; value: string }[];
};
