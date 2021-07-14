import * as React from 'react';
import * as _ from 'lodash';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { Status, useDeepCompareMemoize } from '@console/shared';
import { sortable } from '@patternfly/react-table';
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
import { CephBlockPoolModel } from '../../models';
import { StoragePoolKind, OcsStorageClassKind, CephClusterKind } from '../../types';
import { CEPH_STORAGE_NAMESPACE, CEPH_EXTERNAL_CR_NAME } from '../../constants';
import {
  blockPoolColumnInfo,
  isDefaultPool,
  getScNamesUsingPool,
  getPerPoolMetrics,
} from '../../utils/block-pool';
import { dateTimeFormatter } from '../../utils/common';
import { PopoverHelper } from '../../utils/popover-helper';
import { getPoolQuery, StorageDashboardQuery } from '../../queries/ceph-queries';
import { COMPRESSION_ON } from '../../constants/storage-pool-const';
import { cephClusterResource, scResource } from '../../resources';

const getHeader = (t: TFunction) => () => {
  return [
    {
      title: t(blockPoolColumnInfo.name.title),
      id: blockPoolColumnInfo.name.id,
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: blockPoolColumnInfo.name.classes },
    },
    {
      title: t(blockPoolColumnInfo.status.title),
      id: blockPoolColumnInfo.status.id,
      props: { className: blockPoolColumnInfo.status.classes },
    },
    {
      title: t(blockPoolColumnInfo.storageclasses.title),
      id: blockPoolColumnInfo.storageclasses.id,
      props: { className: blockPoolColumnInfo.storageclasses.classes },
    },
    {
      title: t(blockPoolColumnInfo.replicas.title),
      id: blockPoolColumnInfo.replicas.id,
      props: { className: blockPoolColumnInfo.replicas.classes },
    },
    {
      title: t(blockPoolColumnInfo.usedcapacity.title),
      id: blockPoolColumnInfo.usedcapacity.id,
      props: { className: blockPoolColumnInfo.usedcapacity.classes },
    },
    {
      title: t(blockPoolColumnInfo.mirroringstatus.title),
      id: blockPoolColumnInfo.mirroringstatus.id,
      props: { className: blockPoolColumnInfo.mirroringstatus.classes },
    },
    {
      title: t(blockPoolColumnInfo.mirroringhealth.title),
      id: blockPoolColumnInfo.mirroringhealth.id,
      props: { className: blockPoolColumnInfo.mirroringhealth.classes },
    },
    {
      title: t(blockPoolColumnInfo.compressionstatus.title),
      id: blockPoolColumnInfo.compressionstatus.id,
      props: { className: blockPoolColumnInfo.compressionstatus.classes },
    },
    {
      title: t(blockPoolColumnInfo.compressionsavings.title),
      id: blockPoolColumnInfo.compressionsavings.id,
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
  const props: BlockPoolListRowProps = customData;
  const { name, namespace } = obj.metadata;
  const replica: string = obj.spec?.replicated?.size;
  const mirroringStatus: boolean = obj.spec?.mirroring?.enabled;
  const mirroringHealth: string = obj.status?.mirroringStatus?.summary?.health;
  const lastChecked: string = obj.status?.mirroringStatus?.lastChecked;
  const compressionStatus: boolean = obj.spec?.compressionMode === COMPRESSION_ON;
  const phase = obj?.status?.phase;

  // Hooks
  const poolScNames: string[] = React.useMemo(
    () => getScNamesUsingPool(props.storageClasses, name),
    [props.storageClasses, name],
  );

  // Metrics
  const rawCapacity: string = humanizeBinaryBytes(props.poolRawCapacity[name] || 0).string;
  const compressionSavings: string = humanizeBinaryBytes(props.poolCompressionSavings[name] || 0)
    .string;

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
        className={blockPoolColumnInfo.mirroringhealth.classes}
        columnID={blockPoolColumnInfo.mirroringhealth.id}
      >
        <Tooltip
          content={`${t('ceph-storage-plugin~Last Synced')} ${dateTimeFormatter(lastChecked)}`}
        >
          <Status status={_.capitalize(mirroringHealth)} />
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
            props.cephCluster?.metadata?.name === CEPH_EXTERNAL_CR_NAME ||
            isDefaultPool(obj)
          }
        />
      </TableData>
    </TableRow>
  );
};

const BlockPoolList: React.FC<BlockPoolListProps> = (props) => {
  const { t } = useTranslation();

  // Hooks
  const [storageClasses, setStorageClasses] = React.useState<OcsStorageClassKind[]>([]);
  const [cephCluster, setCephCluster] = React.useState<CephClusterKind>();
  const [cephClusters, isLoaded, loadError] = useK8sWatchResource<CephClusterKind[]>(
    cephClusterResource,
  );
  const filteredCephClusters: CephClusterKind[] = useDeepCompareMemoize(cephClusters, true);
  const [scResources, scLoaded, scLoadError] = useK8sWatchResource<OcsStorageClassKind[]>(
    scResource,
  );
  const filteredScResources: OcsStorageClassKind[] = useDeepCompareMemoize(scResources, true);

  const poolNames: string[] = React.useMemo(() => props.data.map((pool) => pool.metadata?.name), [
    props.data,
  ]);

  React.useEffect(() => {
    if (filteredCephClusters.length && isLoaded && !loadError) {
      setCephCluster(filteredCephClusters[0]);
    }
  }, [filteredCephClusters, isLoaded, loadError]);

  React.useEffect(() => {
    if (filteredScResources && scLoaded && !scLoadError) {
      setStorageClasses(filteredScResources);
    }
  }, [filteredScResources, scLoaded, scLoadError]);

  // Metrics
  const [poolRawCapacityMetrics, rawCapLoadError, rawCapLoading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: getPoolQuery(poolNames, StorageDashboardQuery.POOL_RAW_CAPACITY_USED),
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
        storageClasses,
        cephCluster,
        poolRawCapacity,
        poolCompressionSavings,
      }}
      virtualize
    />
  );
};

export const BlockPoolListPage: React.FC = (props) => {
  const createProps = {
    to: `${resourcePathFromModel(
      CephBlockPoolModel,
      null,
      _.get(props, 'namespace', CEPH_STORAGE_NAMESPACE),
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
  [name: string]: string;
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
