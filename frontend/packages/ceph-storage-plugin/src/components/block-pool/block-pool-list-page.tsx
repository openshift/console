import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';

import { useDeepCompareMemoize, StatusIconAndText, Status } from '@console/shared';
import { sortable, wrappable } from '@patternfly/react-table';
import { Tooltip } from '@patternfly/react-core';
import { referenceForModel, referenceFor } from '@console/internal/module/k8s';
import { ListPage, Table, RowFunctionArgs, TableData } from '@console/internal/components/factory';
import {
  ResourceIcon,
  ResourceKebab,
  Kebab,
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

const BlockPoolTableRow: React.FC<RowFunctionArgs<StoragePoolKind>> = ({ obj, customData }) => {
  const { t } = useTranslation();
  const blockPoolColumnInfo = BlockPoolColumnInfo(t);
  const props: BlockPoolListRowProps = customData;
  const { name } = obj.metadata;
  const replica = obj.spec?.replicated?.size;
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

  // Details page link
  const to = `${props.listPagePath}/${name}`;

  // Metrics
  // {poolRawCapacity: {"pool-1" : size_bytes, "pool-2" : size_bytes, ...}}
  const rawCapacity: string = props.poolRawCapacity[name]
    ? humanizeBinaryBytes(props.poolRawCapacity[name]).string
    : '-';
  const compressionSavings: string = props.poolCompressionSavings[name]
    ? humanizeBinaryBytes(props.poolCompressionSavings[name]).string
    : '-';

  return (
    <>
      <TableData
        className={blockPoolColumnInfo.name.classes}
        columnID={blockPoolColumnInfo.name.id}
      >
        <ResourceIcon kind={referenceForModel(CephBlockPoolModel)} />
        <Link to={to} className="co-resource-item__resource-name" data-test={name}>
          {name}
        </Link>
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
    </>
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

  // compression queries
  const [compressionSavings, compressionLoadError, compressionLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: getPoolQuery(poolNames, StorageDashboardQuery.POOL_COMPRESSION_SAVINGS),
    namespace: CEPH_STORAGE_NAMESPACE,
  });

  const customData = React.useMemo(() => {
    const poolRawCapacity: PoolMetrics = getPerPoolMetrics(
      poolRawCapacityMetrics,
      rawCapLoadError,
      rawCapLoading,
    );
    const poolCompressionSavings: PoolMetrics = getPerPoolMetrics(
      compressionSavings,
      compressionLoadError,
      compressionLoading,
    );
    return {
      storageClasses: memoizedSC ?? [],
      cephCluster: cephClusters?.[0],
      poolRawCapacity,
      poolCompressionSavings,
      listPagePath: props.customData,
    };
  }, [
    cephClusters,
    compressionLoadError,
    compressionLoading,
    compressionSavings,
    memoizedSC,
    poolRawCapacityMetrics,
    rawCapLoadError,
    rawCapLoading,
    props.customData,
  ]);

  return (
    <Table
      {...props}
      aria-label={t('ceph-storage-plugin~BlockPool List')}
      Header={getHeader(t)}
      Row={BlockPoolTableRow}
      customData={customData}
      virtualize
    />
  );
};

export const BlockPoolListPage: React.FC<BlockListPoolPageProps> = (props) => {
  const location = useLocation();
  const listPagePath: string = location.pathname;
  const createProps = {
    to: `${listPagePath}/create/~new`,
  };
  return (
    <ListPage
      {...props}
      canCreate
      showTitle
      createProps={createProps}
      kind={referenceForModel(CephBlockPoolModel)}
      ListComponent={BlockPoolList}
      customData={listPagePath}
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
  listPagePath: string;
};

type BlockPoolListProps = {
  data: StoragePoolKind[];
  customData: string;
};

type BlockListPoolPageProps = {
  namespace: string;
};
