import * as React from 'react';
import { OutlinedCheckSquareIcon, OutlinedSquareIcon } from '@patternfly/react-icons';
import { sortable } from '@patternfly/react-table';
import { Table, TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { getHostNICs } from '../../selectors';
import { BareMetalHostNIC, BareMetalHostKind } from '../../types';

const NICsTableHeader = () => [
  { title: 'Name', sortField: 'name', transforms: [sortable] },
  { title: 'Model', sortField: 'model', transforms: [sortable] },
  { title: 'PXE', sortField: 'pxe', transforms: [sortable] },
  { title: 'IP', sortField: 'ip', transforms: [sortable] },
  { title: 'Speed', sortField: 'speedGbps', transforms: [sortable] },
  { title: 'MAC Address', sortField: 'mac', transforms: [sortable] },
  { title: 'VLAN ID', sortField: 'vlanId', transforms: [sortable] },
];

const NICsTableRow: RowFunction<BareMetalHostNIC> = ({ obj: nic, index, key, style }) => {
  const { ip, mac, model, name, pxe, speedGbps, vlanId } = nic;
  return (
    <TableRow id={ip} index={index} trKey={key} style={style}>
      <TableData>{name}</TableData>
      <TableData>{model}</TableData>
      <TableData>{pxe ? <OutlinedCheckSquareIcon /> : <OutlinedSquareIcon />}</TableData>
      <TableData>{ip}</TableData>
      <TableData>{speedGbps} Gbps</TableData>
      <TableData>{mac}</TableData>
      <TableData>{vlanId}</TableData>
    </TableRow>
  );
};

type BareMetalHostNICsProps = {
  obj: BareMetalHostKind;
  loadError?: any;
};

const BareMetalHostNICs: React.FC<BareMetalHostNICsProps> = ({ obj: host, loadError }) => {
  const nics = getHostNICs(host);
  return (
    <div className="co-m-list">
      <div className="co-m-pane__body">
        <Table
          data={nics}
          aria-label="Bare Metal Host NICs"
          Header={NICsTableHeader}
          Row={NICsTableRow}
          loaded={!!host}
          loadError={loadError}
        />
      </div>
    </div>
  );
};

export default BareMetalHostNICs;
