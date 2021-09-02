import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { Kebab, ResourceKebab } from '@console/internal/components/utils';
import {
  TableData,
  Table,
  ListPage,
  Flatten,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import {
  referenceForGroupVersionKind,
  referenceForModel,
  FirehoseResourcesResult,
} from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { sortable, wrappable } from '@patternfly/react-table';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { RowFilter, ColumnLayout } from '@console/dynamic-plugin-sdk';
import ODFSystemLink from './system-link';
import { getGVK, normalizeMetrics } from './utils';
import { getActions } from './actions';
import { StorageSystemModel } from '../../models';
import { StorageSystemKind } from '../../types';
import { ODF_QUERIES, ODFQueries } from '../../queries';
import { CEPH_STORAGE_NAMESPACE } from '../../constants';

const tableColumnClasses = [
  'pf-u-w-15-on-xl',
  'pf-m-hidden pf-m-visible-on-md pf-u-w-12-on-xl',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-12-on-xl',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-12-on-xl',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-12-on-xl',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-12-on-xl',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-12-on-xl',
  Kebab.columnClass,
];

type CustomData = {
  normalizedMetrics: ReturnType<typeof normalizeMetrics>;
};

const SystemTableRow: React.FC<RowFunctionArgs<StorageSystemKind, CustomData>> = ({
  obj,
  customData,
}) => {
  const { t } = useTranslation();
  const { apiGroup, apiVersion, kind } = getGVK(obj.spec.kind);
  const systemKind = referenceForGroupVersionKind(apiGroup)(apiVersion)(kind);
  const providerName = obj?.spec?.name;
  const systemName = obj?.metadata?.name;
  const { normalizedMetrics } = customData;

  const { rawCapacity, usedCapacity, iops, throughput, latency } =
    normalizedMetrics?.[systemName] || {};

  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ODFSystemLink kind={systemKind} systemName={systemName} providerName={providerName} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Status status={obj?.metadata?.deletionTimestamp ? 'Terminating' : obj?.status?.phase} />
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
    </>
  );
};

const StorageSystemList: React.FC<StorageSystemListProps> = (props) => {
  const { t } = useTranslation();
  const Header = () => {
    return [
      {
        title: t('ceph-storage-plugin~Name'),
        sortField: 'metadata.name',
        transforms: [sortable, wrappable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('ceph-storage-plugin~Status'),
        transforms: [wrappable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('ceph-storage-plugin~Raw Capacity'),
        transforms: [wrappable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('ceph-storage-plugin~Used capacity'),
        transforms: [wrappable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('ceph-storage-plugin~IOPS'),
        transforms: [wrappable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: t('ceph-storage-plugin~Throughput'),
        transforms: [wrappable],
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

  const normalizedMetrics = React.useMemo(
    () => ({
      normalizedMetrics: normalizeMetrics(
        props.data,
        latency,
        throughput,
        rawCapacity,
        usedCapacity,
        iops,
      ),
    }),
    [props.data, iops, latency, rawCapacity, throughput, usedCapacity],
  );

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
      namespace={CEPH_STORAGE_NAMESPACE}
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
  data?: StorageSystemKind[];
};

export default StorageSystemListPage;
