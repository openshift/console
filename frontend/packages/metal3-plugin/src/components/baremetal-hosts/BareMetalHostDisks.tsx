import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Table, TableRow, TableData, RowFunction } from '@console/internal/components/factory';
import { humanizeDecimalBytes } from '@console/internal/components/utils';
import { getHostStorage } from '../../selectors';
import { BareMetalHostDisk, BareMetalHostKind } from '../../types';

const DisksTableHeader = (t: TFunction) => () => [
  { title: t('metal3-plugin~Name'), sortField: 'name', transforms: [sortable] },
  { title: t('metal3-plugin~Size'), sortField: 'sizeBytes', transforms: [sortable] },
  { title: t('metal3-plugin~Type'), sortField: 'rotational', transforms: [sortable] },
  { title: t('metal3-plugin~Model'), sortField: 'model', transforms: [sortable] },
  { title: t('metal3-plugin~Serial Number'), sortField: 'serialNumber', transforms: [sortable] },
  { title: t('metal3-plugin~Vendor'), sortField: 'vendor', transforms: [sortable] },
  { title: t('metal3-plugin~HCTL'), sortField: 'hctl', transforms: [sortable] },
];

const DisksTableRow: RowFunction<BareMetalHostDisk> = ({ obj, index, key, style }) => {
  const { hctl, model, name, rotational, serialNumber, sizeBytes, vendor } = obj;
  const { string: size } = humanizeDecimalBytes(sizeBytes);
  return (
    <TableRow id={name} index={index} trKey={key} style={style}>
      <TableData>{name}</TableData>
      <TableData>{size}</TableData>
      <TableData>{rotational ? 'Rotational' : 'SSD'}</TableData>
      <TableData>{model}</TableData>
      <TableData>{serialNumber}</TableData>
      <TableData>{vendor}</TableData>
      <TableData>{hctl}</TableData>
    </TableRow>
  );
};

type BareMetalHostDisksProps = {
  obj: BareMetalHostKind;
  loadError?: any;
};

const BareMetalHostDisks: React.FC<BareMetalHostDisksProps> = ({ obj: host, loadError }) => {
  const { t } = useTranslation();
  const disks = getHostStorage(host);
  return (
    <div className="co-m-list">
      <div className="co-m-pane__body">
        <Table
          data={disks}
          aria-label="Bare Metal Host Disks"
          Header={DisksTableHeader(t)}
          Row={DisksTableRow}
          loaded={!!host}
          loadError={loadError}
        />
      </div>
    </div>
  );
};

export default BareMetalHostDisks;
