import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { useDeepCompareMemoize, StatusIconAndText, Status } from '@console/shared';
import { sortable, wrappable } from '@patternfly/react-table';
import { Tooltip } from '@patternfly/react-core';
import { referenceForModel, K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import {
  ListPage,
  Table,
  RowFunction,
  RowFunctionArgs,
  TableRow,
  TableData,
} from '@console/internal/components/factory';
import {
  ResourceLink,
  ResourceKebab,
  Kebab,
  resourcePathFromModel,
  humanizeBinaryBytes,
} from '@console/internal/components/utils';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { StorageClassModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

import { menuActions } from './block-pool-menu-action';
import { healthStateMapping } from '../dashboards/block-pool/states';
import { CephBlockPoolModel } from '../../models';
import { StoragePoolKind, OcsStorageClassKind, CephClusterKind } from '../../types';
import { CEPH_STORAGE_NAMESPACE, CEPH_EXTERNAL_CR_NAME } from '../../constants';
import {
  BlockPoolColumnInfo,
  isDefaultPool,
  getScNamesUsingPool,
  getPerPoolMetrics,
} from '../../utils/block-pool';
import { twelveHoursdateTimeNoYear } from '../../utils/common';
import { PopoverHelper } from '../../utils/popover-helper';
import { getPoolQuery, StorageDashboardQuery } from '../../queries/ceph-queries';
import { COMPRESSION_ON } from '../../constants/storage-pool-const';
import { cephClusterResource, scResource } from '../../resources';

const getHeader = (t: TFunction) => () => {
  const blockPoolColumnInfo = BlockPoolColumnInfo(t);

  return [
    {
      title: blockPoolColumnInfo.name.title,
      id: blockPoolColumnInfo.name.id,
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: blockPoolColumnInfo.name.classes },
    },
    {
      title: blockPoolColumnInfo.status.title,
      id: blockPoolColumnInfo.status.id,
      props: { className: blockPoolColumnInfo.status.classes },
    },
    {
      title: blockPoolColumnInfo.storageclasses.title,
      id: blockPoolColumnInfo.storageclasses.id,
      props: { className: blockPoolColumnInfo.storageclasses.classes },
    },
    {
      title: blockPoolColumnInfo.replicas.title,
      id: blockPoolColumnInfo.replicas.id,
      props: { className: blockPoolColumnInfo.replicas.classes },
    },
    {
      title: blockPoolColumnInfo.usedcapacity.title,
      id: blockPoolColumnInfo.usedcapacity.id,
      transforms: [wrappable],
      props: { className: blockPoolColumnInfo.usedcapacity.classes },
    },
    {
      title: blockPoolColumnInfo.mirroringstatus.title,
      id: blockPoolColumnInfo.mirroringstatus.id,
      transforms: [wrappable],
      props: { className: blockPoolColumnInfo.mirroringstatus.classes },
    },
    {
      title: blockPoolColumnInfo.overallImagehealth.title,
      id: blockPoolColumnInfo.overallImagehealth.id,
      transforms: [wrappable],
      props: { className: blockPoolColumnInfo.overallImagehealth.classes },
    },
    {
      title: blockPoolColumnInfo.compressionstatus.title,
      id: blockPoolColumnInfo.compressionstatus.id,
      transforms: [wrappable],
      props: { className: blockPoolColumnInfo.compressionstatus.classes },
    },
    {
      title: blockPoolColumnInfo.compressionsavings.title,
      id: blockPoolColumnInfo.compressionsavings.id,
      transforms: [wrappable],
      props: { className: blockPoolColumnInfo.compressionsavings.classes },
    },
    {
      title: '',
      props: { className: Kebab.columnClass },
    },
  ];
};

const getRows: RowFunction<K8sResourceKind> = (props) => <BlockPoolTableRow {...props} />;

const BlockPoolTableRow: React.FC<RowFunctionArgs> = ({ obj, index, key, style, customData }) => {
  const { t } = useTranslation();
  const blockPoolColumnInfo = BlockPoolColumnInfo(t);
  const props: BlockPoolListRowProps = customData;
  const { name, namespace } = obj.metadata;
  const replica: string = obj.spec?.replicated?.size;
  const mirroringStatus: boolean = obj.spec?.mirroring?.enabled;
  const mirroringImageHealth: string = mirroringStatus
    ? obj.status?.mirroringStatus?.summary?.image_health
    : '-';
  const lastChecked: string = obj.status?.mirroringStatus?.lastChecked;
  const formatedDateTime = lastChecked
    ? twelveHoursdateTimeNoYear.format(new Date(lastChecked))
    : '-';
  const compressionStatus: boolean = obj.spec?.compressionMode === COMPRESSION_ON;
  const phase = obj?.status?.phase;

  // Hooks
  const poolScNames: string[] = React.useMemo(
    () => getScNamesUsingPool(props?.storageClasses, name),
    [name, props],
  );

  // Metrics
  // {poolRawCapacity: {"pool-1" : size_bytes, "pool-2" : size_bytes, ...}}
  const rawCapacity: string = props.poolRawCapacity[name]
    ? humanizeBinaryBytes(props.poolRawCapacity[name]).string
    : '-';
  const compressionSavings: string = props.poolCompressionSavings[name]
    ? humanizeBinaryBytes(props.poolCompressionSavings[name]).string
    : '-';

  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData
        className={blockPoolColumnInfo.name.classes}
        columnID={blockPoolColumnInfo.name.id}
      >
        <ResourceLink kind={referenceFor(obj)} name={name} namespace={namespace} />
      </TableData>
      <TableData
        className={blockPoolColumnInfo.status.classes}
        columnID={blockPoolColumnInfo.status.id}
      >
        <Status status={phase} />
      </TableData>
      <TableData
        className={blockPoolColumnInfo.storageclasses.classes}
        columnID={blockPoolColumnInfo.storageclasses.id}
      >
        <PopoverHelper names={poolScNames} text="StorageClasses" kind={StorageClassModel} />
      </TableData>
      <TableData
        className={blockPoolColumnInfo.replicas.classes}
        columnID={blockPoolColumnInfo.replicas.id}
      >
        {replica}
      </TableData>
      <TableData
        className={blockPoolColumnInfo.usedcapacity.classes}
        columnID={blockPoolColumnInfo.usedcapacity.id}
      >
        {rawCapacity}
      </TableData>
      <TableData
        className={blockPoolColumnInfo.mirroringstatus.classes}
        columnID={blockPoolColumnInfo.mirroringstatus.id}
      >
        {mirroringStatus ? t('ceph-storage-plugin~Enabled') : t('ceph-storage-plugin~Disabled')}
      </TableData>
      <TableData
        className={blockPoolColumnInfo.overallImagehealth.classes}
        columnID={blockPoolColumnInfo.overallImagehealth.id}
      >
        <Tooltip content={`${t('ceph-storage-plugin~Last synced')} ${formatedDateTime}`}>
          <StatusIconAndText
            title={mirroringImageHealth}
            icon={healthStateMapping[mirroringImageHealth]?.icon}
          />
        </Tooltip>
      </TableData>
      <TableData
        className={blockPoolColumnInfo.compressionstatus.classes}
        columnID={blockPoolColumnInfo.compressionstatus.id}
      >
        {compressionStatus ? t('ceph-storage-plugin~Enabled') : t('ceph-storage-plugin~Disabled')}
      </TableData>
      <TableData
        className={blockPoolColumnInfo.compressionsavings.classes}
        columnID={blockPoolColumnInfo.compressionsavings.id}
      >
        {compressionStatus ? compressionSavings : '-'}
      </TableData>
      <TableData className={Kebab.columnClass}>
        <ResourceKebab
          actions={menuActions}
          kind={referenceFor(obj)}
          resource={obj}
          isDisabled={
            obj?.metadata?.deletionTimestamp ||
            props?.cephCluster?.metadata?.name === CEPH_EXTERNAL_CR_NAME ||
            isDefaultPool(obj)
          }
          customData={{ tFunction: t }}
        />
      </TableData>
    </TableRow>
  );
};

const BlockPoolList: React.FC<BlockPoolListProps> = (props) => {
  const { t } = useTranslation();

  // Hooks
  const [cephClusters] = useK8sWatchResource<CephClusterKind[]>(cephClusterResource);
  const [scResources] = useK8sWatchResource<OcsStorageClassKind[]>(scResource);
  const memoizedSC: OcsStorageClassKind[] = useDeepCompareMemoize(scResources, true);
  const poolNames: string[] = props.data.map((pool) => pool.metadata?.name);
  const memoizedPoolNames = useDeepCompareMemoize(poolNames, true);

  // Metrics
  const [poolRawCapacityMetrics, rawCapLoadError, rawCapLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: getPoolQuery(memoizedPoolNames, StorageDashboardQuery.POOL_RAW_CAPACITY_USED),
    namespace: CEPH_STORAGE_NAMESPACE,
  });
  const poolRawCapacity: PoolMetrics = getPerPoolMetrics(
    poolRawCapacityMetrics,
    rawCapLoadError,
    rawCapLoading,
  );
  // compression queries
  const [compressionSavings, compressionLoadError, compressionLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: getPoolQuery(poolNames, StorageDashboardQuery.POOL_COMPRESSION_SAVINGS),
    namespace: CEPH_STORAGE_NAMESPACE,
  });
  const poolCompressionSavings: PoolMetrics = getPerPoolMetrics(
    compressionSavings,
    compressionLoadError,
    compressionLoading,
  );

  return (
    <Table
      {...props}
      aria-label={t('ceph-storage-plugin~BlockPool List')}
      Header={getHeader(t)}
      Row={getRows}
      customData={{
        storageClasses: memoizedSC ?? [],
        cephCluster: cephClusters?.[0],
        poolRawCapacity,
        poolCompressionSavings,
      }}
      virtualize
    />
  );
};

export const BlockPoolListPage: React.FC<BlockListPoolPageProps> = (props) => {
  const createProps = {
    to: `${resourcePathFromModel(
      CephBlockPoolModel,
      null,
      props.namespace ?? CEPH_STORAGE_NAMESPACE,
    )}/~new`,
  };
  return (
    <ListPage
      {...props}
      canCreate
      showTitle
      createProps={createProps}
      kind={referenceForModel(CephBlockPoolModel)}
      ListComponent={BlockPoolList}
    />
  );
};

export type PoolMetrics = {
  [poolName: string]: string;
};

type BlockPoolListRowProps = {
  cephCluster: CephClusterKind;
  storageClasses: OcsStorageClassKind[];
  poolRawCapacity: PoolMetrics;
  poolCompressionSavings: PoolMetrics;
};

type BlockPoolListProps = {
  data: StoragePoolKind[];
};

type BlockListPoolPageProps = {
  namespace: string;
};
