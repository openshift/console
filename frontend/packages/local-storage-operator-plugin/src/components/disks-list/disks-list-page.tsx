import * as React from 'react';
import * as _ from 'lodash';
import * as cx from 'classnames';
import {
  Table,
  TableProps,
  TableRow,
  TableData,
  RowFunction,
  MultiListPage,
} from '@console/internal/components/factory';
import { sortable } from '@patternfly/react-table';
import { FirehoseResult, humanizeBinaryBytes, Kebab } from '@console/internal/components/utils';
import { referenceForModel, NodeKind, K8sResourceCommon } from '@console/internal/module/k8s';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { useFlag } from '@console/shared/src/hooks/flag';
import { OCS_ATTACHED_DEVICES_FLAG } from '@console/ceph-storage-plugin/src/features';
import { OCSKebabOptions } from '@console/ceph-storage-plugin/src/components/attached-devices-mode/lso-disk-inventory/ocs-kebab-options';
import { LocalVolumeDiscoveryResult } from '../../models';
import { LABEL_SELECTOR } from '../../constants/disks-list';

export const diskFilters: RowFilter[] = [
  {
    type: 'disk-state',
    filterGroupName: 'Disk State',
    reducer: (disk: DiskMetadata) => {
      return disk?.status?.state;
    },
    items: [
      { id: 'Available', title: 'Available' },
      { id: 'NotAvailable', title: 'NotAvailable' },
      { id: 'Unknown', title: 'Unknown' },
    ],
    filter: (states: { all: DiskStates[]; selected: Set<DiskStates> }, disk: DiskMetadata) => {
      if (!states || !states.selected || _.isEmpty(states.selected)) {
        return true;
      }
      const diskState = disk?.status.state;
      return states.selected.has(diskState) || !_.includes(states.all, diskState);
    },
  },
];

export const tableColumnClasses = [
  '',
  '',
  cx('pf-m-hidden', 'pf-m-visible-on-xl'),
  cx('pf-m-hidden', 'pf-m-visible-on-2xl'),
  cx('pf-m-hidden', 'pf-m-visible-on-lg'),
  cx('pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

const getDiskHeader = (isOCSAttachedDevices: boolean) => {
  const headers = [
    {
      title: 'Name',
      sortField: 'path',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Disk State',
      sortField: 'status.state',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Type',
      sortField: 'type',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Model',
      sortField: 'model',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Capacity',
      sortField: 'size',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Filesystem',
      sortField: 'fstype',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
  ];
  if (isOCSAttachedDevices) {
    headers.push({
      title: '',
      sortField: '',
      transforms: [],
      props: { className: tableColumnClasses[6] },
    });
  }
  return () => headers;
};

const diskRow: RowFunction<DiskMetadata, OCSMetadata> = ({
  obj,
  index,
  key,
  style,
  customData,
}) => {
  const { isOCSAttachedDevices, diskOsdMap } = customData;
  const diskName = obj.path;
  return (
    <TableRow id={obj.deviceID} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>{obj.path}</TableData>
      <TableData className={tableColumnClasses[1]}>{obj.status.state}</TableData>
      <TableData className={tableColumnClasses[2]}>{obj.type || '-'}</TableData>
      <TableData className={cx(tableColumnClasses[3], 'co-break-word')}>
        {obj.model || '-'}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {humanizeBinaryBytes(obj.size).string || '-'}
      </TableData>
      <TableData className={tableColumnClasses[5]}>{obj.fstype || '-'}</TableData>
      {isOCSAttachedDevices && <OCSKebabOptions diskName={diskName} diskOsdMap={diskOsdMap} />}
    </TableRow>
  );
};

const DisksList: React.FC<TableProps> = (props) => {
  const diskHeader = getDiskHeader(props.customData.isOCSAttachedDevices);
  return <Table {...props} aria-label="Disks List" Header={diskHeader} Row={diskRow} virtualize />;
};

const DisksListPage: React.FC<{ obj: NodeKind }> = (props) => {
  const isOCSAttachedDevices = useFlag(OCS_ATTACHED_DEVICES_FLAG);
  const nodeName = props.obj.metadata.name;
  const propName = `lvdr-${nodeName}`;

  return (
    <MultiListPage
      canCreate={false}
      title="Disks"
      hideLabelFilter
      textFilter="node-disk-name"
      rowFilters={diskFilters}
      flatten={(resource: FirehoseResult<LocalVolumeDiscoveryResult>) =>
        resource[propName]?.data[0]?.status?.discoveredDevices ?? []
      }
      ListComponent={DisksList}
      resources={[
        {
          kind: referenceForModel(LocalVolumeDiscoveryResult),
          prop: propName,
          selector: { [LABEL_SELECTOR]: nodeName },
        },
      ]}
      customData={{
        diskOsdMap: new Map() /* TBD(Afreen) Will be changed to actual state with this https://issues.redhat.com/browse/RHSTOR-1194  */,
        isOCSAttachedDevices,
      }}
    />
  );
};

export default DisksListPage;

type DiskMetadata = LocalVolumeDiscoveryResult['status']['discoveredDevices'];
type OCSMetadata = {
  isOCSAttachedDevices: boolean;
  diskOsdMap: Map<string, string>;
};

type LocalVolumeDiscoveryResult = K8sResourceCommon & {
  spec: {
    nodeName: string;
  };
  status: {
    discoveredDevices: {
      deviceID: string;
      fstype: string;
      model: string;
      path: string;
      serial: string;
      size: string;
      status: {
        state: DiskStates;
      };
      type: string;
      vendor: string;
    };
  };
};

type DiskStates = 'Available' | 'Unknown' | 'NotAvailable';
