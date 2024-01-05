import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { ListPageBody } from '@console/dynamic-plugin-sdk';
import { TableData, ListPage, Table, RowFunctionArgs } from '@console/internal/components/factory';
import { useListPageFilter } from '@console/internal/components/factory/ListPage/filter-hook';
import ListPageFilter from '@console/internal/components/factory/ListPage/ListPageFilter';
import {
  ResourceLink,
  ResourceKebab,
  Timestamp,
  Kebab,
  convertToBaseValue,
  humanizeBinaryBytes,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
  VolumeSnapshotContentModel,
} from '@console/internal/models';
import {
  K8sResourceKind,
  PersistentVolumeClaimKind,
  referenceForModel,
  VolumeSnapshotKind,
} from '@console/internal/module/k8s';
import { Status, getName, getNamespace, snapshotSource, FLAGS } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import { snapshotStatusFilters, volumeSnapshotStatus } from '../../status';

const { common, RestorePVC } = Kebab.factory;
const menuActions = [RestorePVC, ...common];

const tableColumnClasses = [
  '', // Name
  '', // Namespace
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // Status
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // Size
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // PVC
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), // Snapshot Content
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), // Snapshot Class
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), // Created At
  Kebab.columnClass,
];

const Header = (disableItems = {}) => () => {
  return [
    {
      title: i18next.t('console-app~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: i18next.t('console-app~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: i18next.t('console-app~Status'),
      sortFunc: 'snapshotStatus',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: i18next.t('console-app~Size'),
      sortFunc: 'volumeSnapshotSize',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: i18next.t('console-app~Source'),
      sortFunc: 'volumeSnapshotSource',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: i18next.t('console-app~Snapshot content'),
      sortField: 'status.boundVolumeSnapshotContentName',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: i18next.t('console-app~VolumeSnapshotClass'),
      sortField: 'spec.volumeSnapshotClassName',
      transforms: [sortable],
      props: { className: tableColumnClasses[6] },
    },
    {
      title: i18next.t('console-app~Created at'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[7] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[8] },
    },
  ].filter((item) => !disableItems[item.title]);
};

const Row: React.FC<RowFunctionArgs<VolumeSnapshotKind>> = ({ obj, customData }) => {
  const { name, namespace, creationTimestamp } = obj?.metadata || {};
  const size = obj?.status?.restoreSize;
  const sizeBase = convertToBaseValue(size);
  const sizeMetrics = size ? humanizeBinaryBytes(sizeBase).string : '-';
  const sourceModel = obj?.spec?.source?.persistentVolumeClaimName
    ? PersistentVolumeClaimModel
    : VolumeSnapshotContentModel;
  const sourceName = snapshotSource(obj);
  const snapshotContent = obj?.status?.boundVolumeSnapshotContentName;
  const snapshotClass = obj?.spec?.volumeSnapshotClassName;
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceForModel(VolumeSnapshotModel)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]} columnID="namespace">
        <ResourceLink kind={NamespaceModel.kind} name={namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={volumeSnapshotStatus(obj)} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>{sizeMetrics}</TableData>
      {!customData?.disableItems?.PVC && (
        <TableData className={tableColumnClasses[4]}>
          <ResourceLink
            kind={referenceForModel(sourceModel)}
            name={sourceName}
            namespace={namespace}
          />
        </TableData>
      )}
      {!customData?.disableItems?.['Snapshot Content'] && (
        <TableData className={tableColumnClasses[5]}>
          {snapshotContent ? (
            <ResourceLink
              kind={referenceForModel(VolumeSnapshotContentModel)}
              name={snapshotContent}
            />
          ) : (
            '-'
          )}
        </TableData>
      )}
      <TableData className={tableColumnClasses[6]}>
        {snapshotClass ? (
          <ResourceLink kind={referenceForModel(VolumeSnapshotClassModel)} name={snapshotClass} />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={tableColumnClasses[7]}>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[8]}>
        <ResourceKebab
          kind={referenceForModel(VolumeSnapshotModel)}
          resource={obj}
          actions={menuActions}
        />
      </TableData>
    </>
  );
};

const VolumeSnapshotTable: React.FC<VolumeSnapshotTableProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('console-app~VolumeSnapshots')}
      Header={Header(props.customData.disableItems)}
      Row={Row}
      virtualize
    />
  );
};

const VolumeSnapshotPage: React.FC<VolumeSnapshotPageProps> = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  const canListVSC = useFlag(FLAGS.CAN_LIST_VSC);
  const namespace = props.namespace || params?.ns || 'all-namespaces';
  const createProps = {
    to: `/k8s/${namespace === 'all-namespaces' ? namespace : `ns/${namespace}`}/${
      VolumeSnapshotModel.plural
    }/~new/form`,
  };
  return (
    <ListPage
      {...props}
      kind={referenceForModel(VolumeSnapshotModel)}
      ListComponent={VolumeSnapshotTable}
      rowFilters={snapshotStatusFilters(t)}
      canCreate
      createProps={createProps}
      customData={{ disableItems: { 'Snapshot Content': !canListVSC } }}
    />
  );
};

const checkPVCSnapshot: CheckPVCSnapshot = (volumeSnapshots, pvc) =>
  volumeSnapshots.filter(
    (snapshot) =>
      snapshot?.spec?.source?.persistentVolumeClaimName === getName(pvc) &&
      getNamespace(snapshot) === getNamespace(pvc),
  );

const FilteredSnapshotTable: React.FC<FilteredSnapshotTable> = (props) => {
  const { t } = useTranslation();
  const { data, customData } = props;
  return (
    <Table
      {...props}
      data={checkPVCSnapshot(data, customData.pvc)}
      aria-label={t('console-app~VolumeSnapshots')}
      Header={Header(customData?.disableItems)}
      Row={Row}
      virtualize
    />
  );
};

export const VolumeSnapshotPVCPage: React.FC<VolumeSnapshotPVCPage> = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  const canListVSC = useFlag(FLAGS.CAN_LIST_VSC);
  const namespace = props.ns || params?.ns;
  const [resources, loaded, loadError] = useK8sWatchResource<VolumeSnapshotKind[]>({
    groupVersionKind: {
      group: VolumeSnapshotModel.apiGroup,
      kind: VolumeSnapshotModel.kind,
      version: VolumeSnapshotModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace,
  });
  const rowFilters = [
    {
      filterGroupName: t('console-app~Status'),
      type: 'snapshot-status',
      reducer: volumeSnapshotStatus,
      filter: () => null,
      items: [
        { id: 'Ready', title: 'Ready' },
        { id: 'Pending', title: 'Pending' },
        { id: 'Error', title: 'Error' },
      ],
    },
  ];
  const [data, filteredData, onFilterChange] = useListPageFilter(resources);

  return (
    <ListPageBody>
      <ListPageFilter
        data={data}
        loaded={loaded}
        onFilterChange={onFilterChange}
        rowFilters={rowFilters}
      />
      <FilteredSnapshotTable
        data={filteredData}
        customData={{
          pvc: props.obj,
          disableItems: { Source: true, 'Snapshot Content': !canListVSC },
        }}
        loaded={loaded}
        loadError={loadError}
      />
    </ListPageBody>
  );
};
type VolumeSnapshotPageProps = {
  namespace?: string;
};

type CheckPVCSnapshot = (
  volumeSnapshots: VolumeSnapshotKind[],
  pvc: K8sResourceKind,
) => VolumeSnapshotKind[];

type FilteredSnapshotTable = {
  data: VolumeSnapshotKind[];
  customData: { [key: string]: any };
  loaded: boolean;
  loadError: any;
};

type VolumeSnapshotPVCPage = {
  obj: PersistentVolumeClaimKind;
  ns: string;
};

type VolumeSnapshotTableProps = {
  customData: { [key: string]: any };
};

export default VolumeSnapshotPage;
