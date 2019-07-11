import * as React from 'react';
import { sortable } from '@patternfly/react-table';

import {
  VirtualTable,
  VirtualTableRow,
  VirtualTableData,
} from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { humanizeDecimalBytes } from '@console/internal/components/utils';
import { getHostStorage } from '../selectors';
import { BaremetalHostDisk } from '../types';

const DisksTableHeader = () => [
  { title: 'Name', sortField: 'name', transforms: [sortable] },
  { title: 'Size', sortField: 'sizeBytes', transforms: [sortable] },
  { title: 'Type', sortField: 'rotational', transforms: [sortable] },
  { title: 'Model', sortField: 'model', transforms: [sortable] },
  { title: 'Serial Number', sortField: 'serialNumber', transforms: [sortable] },
  { title: 'Vendor', sortField: 'vendor', transforms: [sortable] },
  { title: 'HCTL', sortField: 'hctl', transforms: [sortable] },
];

type DisksTableRowProps = {
  obj: BaremetalHostDisk;
  index: number;
  key?: string;
  style: React.StyleHTMLAttributes<any>;
};

const DisksTableRow: React.FC<DisksTableRowProps> = ({ obj, index, key, style }) => {
  const { hctl, model, name, rotational, serialNumber, sizeBytes, vendor } = obj;
  const { string: size } = humanizeDecimalBytes(sizeBytes);
  return (
    <VirtualTableRow id={name} index={index} trKey={key} style={style}>
      <VirtualTableData>{name}</VirtualTableData>
      <VirtualTableData>{size}</VirtualTableData>
      <VirtualTableData>{rotational ? 'Rotational' : 'SSD'}</VirtualTableData>
      <VirtualTableData>{model}</VirtualTableData>
      <VirtualTableData>{serialNumber}</VirtualTableData>
      <VirtualTableData>{vendor}</VirtualTableData>
      <VirtualTableData>{hctl}</VirtualTableData>
    </VirtualTableRow>
  );
};

type BaremetalHostNICListProps = {
  obj: K8sResourceKind;
};

const BaremetalHostDiskList: React.FC<BaremetalHostNICListProps> = ({ obj: host }) => {
  const disks = getHostStorage(host);
  return (
    <div className="co-m-list">
      <div className="co-m-pane__body">
        <VirtualTable
          data={disks}
          aria-label="Baremetal Host NICs"
          Header={DisksTableHeader}
          Row={DisksTableRow}
          loaded
        />
      </div>
    </div>
  );
};

export default BaremetalHostDiskList;
