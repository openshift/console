import * as React from 'react';
import { match } from 'react-router';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import {
  K8sResourceKind,
  PersistentVolumeClaimKind,
  referenceForModel,
  VolumeSnapshotKind,
} from '@console/internal/module/k8s';
import {
  ResourceLink,
  ResourceKebab,
  Timestamp,
  Kebab,
  convertToBaseValue,
  humanizeBinaryBytes,
} from '@console/internal/components/utils';
import {
  TableRow,
  TableData,
  ListPage,
  Table,
  RowFunction,
} from '@console/internal/components/factory';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
  VolumeSnapshotContentModel,
} from '@console/internal/models';
import {
  Status,
  getBadgeFromType,
  BadgeType,
  getName,
  getNamespace,
  snapshotSource,
} from '@console/shared';
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

const Header = (disableItems = {}) => () =>
  [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: 'Status',
      sortFunc: 'snapshotStatus',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Size',
      sortFunc: 'volumeSnapshotSize',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Source',
      sortFunc: 'volumeSnapshotSource',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Snapshot Content',
      sortField: 'status.boundVolumeSnapshotContentName',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: 'Snapshot Class',
      sortField: 'spec.volumeSnapshotClassName',
      transforms: [sortable],
      props: { className: tableColumnClasses[6] },
    },
    {
      title: 'Created At',
      sortField: 'metadata.creationTimeStamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[7] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[8] },
    },
  ].filter((item) => !disableItems[item.title]);

const Row: RowFunction<VolumeSnapshotKind> = ({ key, obj, style, index, customData }) => {
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
    <TableRow id={obj?.metadata?.uid} index={index} trKey={key} style={style}>
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
    </TableRow>
  );
};

const VolumeSnapshotTable: React.FC = (props) => (
  <Table {...props} aria-label="Volume Snapshot Table" Header={Header()} Row={Row} virtualize />
);

const VolumeSnapshotPage: React.FC<VolumeSnapshotPageProps> = (props) => {
  const namespace = props.namespace || props.match?.params?.ns || 'all-namespaces';
  const createProps = {
    to: `/k8s/${namespace === 'all-namespaces' ? namespace : `ns/${namespace}`}/${
      props.match?.params?.plural
    }/~new/form`,
  };
  return (
    <ListPage
      {...props}
      kind={referenceForModel(VolumeSnapshotModel)}
      ListComponent={VolumeSnapshotTable}
      rowFilters={snapshotStatusFilters}
      canCreate
      createProps={createProps}
      badge={getBadgeFromType(BadgeType.TECH)}
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
  const { data, customData } = props;
  return (
    <Table
      {...props}
      data={checkPVCSnapshot(data, customData.pvc)}
      aria-label="PVC Volume Snapshot Table"
      Header={Header(customData?.disableItems)}
      Row={Row}
      virtualize
    />
  );
};

export const VolumeSnapshotPVCPage: React.FC<VolumeSnapshotPVCPage> = (props) => {
  return (
    <ListPage
      {...props}
      kind={referenceForModel(VolumeSnapshotModel)}
      ListComponent={FilteredSnapshotTable}
      rowFilters={snapshotStatusFilters}
      customData={{ pvc: props.obj, disableItems: { PVC: true } }}
    />
  );
};
type VolumeSnapshotPageProps = {
  namespace?: string;
  match: match<{ ns?: string; plural?: string }>;
};

type CheckPVCSnapshot = (
  volumeSnapshots: VolumeSnapshotKind[],
  pvc: K8sResourceKind,
) => VolumeSnapshotKind[];

type FilteredSnapshotTable = {
  data: VolumeSnapshotKind[];
  customData: { [key: string]: any };
};

type VolumeSnapshotPVCPage = {
  obj: PersistentVolumeClaimKind;
};

export default VolumeSnapshotPage;
