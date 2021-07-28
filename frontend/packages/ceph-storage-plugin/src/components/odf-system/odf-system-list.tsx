import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { Kebab, ResourceKebab } from '@console/internal/components/utils';
import {
  RowFunction,
  TableData,
  TableRow,
  Table,
  ListPage,
  Flatten,
} from '@console/internal/components/factory';
import {
  referenceForGroupVersionKind,
  referenceForModel,
  FirehoseResourcesResult,
} from '@console/internal/module/k8s';
import { StatusIcon } from '@console/shared';
import { sortable } from '@patternfly/react-table';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { ColumnLayout } from '@console/internal/components/modals/column-management-modal';
import ODFSystemLink from './system-link';
import { getGVK, SystemMetrics, normalizeMetrics } from './utils';
import { getActions } from './actions';
import { StorageSystemModel } from '../../models';
import { StorageSystemKind } from '../../types';
import { ODF_QUERIES, ODFQueries } from '../../queries';

const tableColumnClasses = [
  'pf-u-w-25-on-xl',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-10-on-xl',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-10-on-xl',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-10-on-xl',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-10-on-xl',
  Kebab.columnClass,
];

const SystemTableRow: RowFunction<StorageSystemKind> = ({ obj, index, key, style, customData }) => {
  const { t } = useTranslation();
  const { apiGroup, apiVersion, kind } = getGVK(obj.spec.kind);
  const systemKind = referenceForGroupVersionKind(apiGroup)(apiVersion)(kind);
  const systemName = obj.spec.name;

  const { rawCapacity, usedCapacity, iops, throughput, latency } =
    (customData as SystemMetrics)?.metrics?.[systemName] || {};

  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ODFSystemLink kind={systemKind} name={systemName} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <span>
          <StatusIcon status={obj?.status?.phase} /> {obj?.status?.phase}
        </span>
      </TableData>
      <TableData className={tableColumnClasses[2]}>{rawCapacity?.string || '-'}</TableData>
      <TableData className={tableColumnClasses[3]}>{usedCapacity?.string || '-'}</TableData>
      <TableData className={tableColumnClasses[4]}>{iops?.string || '-'}</TableData>
      <TableData className={tableColumnClasses[5]}>{throughput?.string || '-'}</TableData>
      <TableData className={tableColumnClasses[6]}>{latency?.string || '-'}</TableData>
      <TableData className={tableColumnClasses[7]}>
        <ResourceKebab
          actions={getActions(systemKind)}
          resource={obj}
          kind={referenceForModel(StorageSystemModel)}
          customData={{ tFunction: t }}
        />
      </TableData>
    </TableRow>
  );
};

const StorageSystemList: React.FC<StorageSystemListProps> = (props) => {
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
        title: t('ceph-storage-plugin~Status'),
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('ceph-storage-plugin~Raw Capacity'),
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('ceph-storage-plugin~Used capacity'),
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('ceph-storage-plugin~IOPS'),
        props: { className: tableColumnClasses[4] },
      },
      {
        title: t('ceph-storage-plugin~Throughput'),
        props: { className: tableColumnClasses[5] },
      },
      {
        title: t('ceph-storage-plugin~Latency'),
        props: { className: tableColumnClasses[6] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[7] },
      },
    ];
  };
  Header.displayName = 'SSHeader';

  const [latency] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: ODF_QUERIES[ODFQueries.LATENCY],
  });
  const [iops] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: ODF_QUERIES[ODFQueries.IOPS],
  });
  const [throughput] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: ODF_QUERIES[ODFQueries.THROUGHPUT],
  });
  const [rawCapacity] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: ODF_QUERIES[ODFQueries.RAW_CAPACITY],
  });
  const [usedCapacity] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: ODF_QUERIES[ODFQueries.USED_CAPACITY],
  });

  const normalizedMetrics = normalizeMetrics(latency, throughput, rawCapacity, usedCapacity, iops);

  return (
    <Table
      {...props}
      customData={normalizedMetrics}
      aria-label={t('ceph-storage-plugin~Storage Systems')}
      Header={Header}
      Row={SystemTableRow}
      virtualize
    />
  );
};

const StorageSystemListPage: React.FC<RouteComponentProps> = (props) => {
  const createProps = {
    to: `/k8s/ns/openshift-storage/${referenceForModel(
      ClusterServiceVersionModel,
    )}/odf-operator/${referenceForModel(StorageSystemModel)}/~new`,
  };
  return (
    <ListPage
      {...props}
      showTitle={false}
      ListComponent={StorageSystemList}
      kind={referenceForModel(StorageSystemModel)}
      canCreate
      createProps={createProps}
    />
  );
};

type StorageSystemListProps = {
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

export default StorageSystemListPage;
