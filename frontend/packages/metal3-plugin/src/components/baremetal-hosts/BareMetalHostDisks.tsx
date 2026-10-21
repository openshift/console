import type { FC } from 'react';
import { sortable } from '@patternfly/react-table';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { RowFunctionArgs } from '@console/internal/components/factory';
import { Table, TableData } from '@console/internal/components/factory';
import { humanizeDecimalBytes } from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { getHostStorage } from '../../selectors';
import type { BareMetalHostDisk, BareMetalHostKind } from '../../types';

const DisksTableHeader = (t: TFunction) => () => [
  { title: t('metal3-plugin~Name'), sortField: 'name', transforms: [sortable] },
  { title: t('metal3-plugin~Size'), sortField: 'sizeBytes', transforms: [sortable] },
  { title: t('metal3-plugin~Type'), sortField: 'rotational', transforms: [sortable] },
  { title: t('metal3-plugin~Model'), sortField: 'model', transforms: [sortable] },
  { title: t('metal3-plugin~Serial Number'), sortField: 'serialNumber', transforms: [sortable] },
  { title: t('metal3-plugin~Vendor'), sortField: 'vendor', transforms: [sortable] },
  { title: t('metal3-plugin~HCTL'), sortField: 'hctl', transforms: [sortable] },
];

const getRowProps = (obj) => ({
  id: obj.name,
});

const DisksTableRow: FC<RowFunctionArgs<BareMetalHostDisk>> = ({ obj }) => {
  const { hctl, model, name, rotational, serialNumber, sizeBytes, vendor } = obj;
  const { string: size } = humanizeDecimalBytes(sizeBytes);
  return (
    <>
      <TableData>{name}</TableData>
      <TableData>{size}</TableData>
      <TableData>{rotational ? 'Rotational' : 'SSD'}</TableData>
      <TableData>{model}</TableData>
      <TableData>{serialNumber}</TableData>
      <TableData>{vendor}</TableData>
      <TableData>{hctl}</TableData>
    </>
  );
};

type BareMetalHostDisksProps = {
  obj: BareMetalHostKind;
  loaded: boolean;
  loadError?: any;
};

const BareMetalHostDisks: FC<BareMetalHostDisksProps> = ({ obj: host, loadError, loaded }) => {
  const { t } = useTranslation();
  const disks = getHostStorage(host);
  return (
    <div className="co-m-list">
      <PaneBody>
        <Table
          data={disks}
          aria-label="Bare Metal Host Disks"
          Header={DisksTableHeader(t)}
          Row={DisksTableRow}
          loaded={loaded}
          loadError={
            loadError ||
            (loaded && !host
              ? { message: t('metal3-plugin~Bare metal host is not available') }
              : undefined)
          }
          getRowProps={getRowProps}
        />
      </PaneBody>
    </div>
  );
};

export default BareMetalHostDisks;
