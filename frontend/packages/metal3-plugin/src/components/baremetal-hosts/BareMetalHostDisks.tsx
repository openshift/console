import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
  ResourceMetadata,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { humanizeDecimalBytes } from '@console/internal/components/utils/units';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { getHostStorage } from '../../selectors/baremetal-hosts';
import type { BareMetalHostDisk, BareMetalHostKind } from '../../types/host';

const useBareMetalHostDiskColumns = (): {
  columns: ConsoleDataViewColumn<BareMetalHostDisk>[];
} => {
  const { t } = useTranslation('metal3-plugin');
  const columns = useMemo(
    () => [
      {
        type: 'name' as const,
        id: 'name',
        title: t('Name'),
        sort: 'name',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'size',
        title: t('Size'),
        sort: 'sizeBytes',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'type',
        title: t('Type'),
        sort: 'rotational',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'model',
        title: t('Model'),
        sort: 'model',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'serialNumber',
        title: t('Serial Number'),
        sort: 'serialNumber',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'vendor',
        title: t('Vendor'),
        sort: 'vendor',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'hctl',
        title: t('HCTL'),
        sort: 'hctl',
        props: { modifier: 'nowrap' as const },
      },
    ],
    [t],
  );
  return { columns };
};

export const getBareMetalHostDiskDataViewRows: GetDataViewRows<BareMetalHostDisk> = (
  data,
  columns,
) =>
  data.map(({ obj: { hctl, model, name, rotational, serialNumber, sizeBytes, vendor } }) => {
    const rowCells = {
      name: { cell: name },
      size: { cell: humanizeDecimalBytes(sizeBytes).string },
      type: { cell: rotational ? 'Rotational' : 'SSD' },
      model: { cell: model },
      serialNumber: { cell: serialNumber },
      vendor: { cell: vendor },
      hctl: { cell: hctl },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });

const getObjectMetadata = (disk: BareMetalHostDisk): ResourceMetadata => ({ name: disk.name });

type BareMetalHostDisksProps = {
  obj: BareMetalHostKind;
  loaded: boolean;
  loadError?: any;
};

const BareMetalHostDisks: FC<BareMetalHostDisksProps> = ({ obj: host, loadError, loaded }) => {
  const { t } = useTranslation('metal3-plugin');
  const { columns } = useBareMetalHostDiskColumns();
  const disks = getHostStorage(host);
  return (
    <div className="co-m-list">
      <PaneBody>
        <ConsoleDataView<BareMetalHostDisk>
          id="console.ui~v1~BareMetalHostDiskTable"
          label={t('Disks')}
          data={disks}
          loaded={loaded}
          loadError={
            loadError ||
            (loaded && !host ? { message: t('Bare metal host is not available') } : undefined)
          }
          columns={columns}
          getDataViewRows={getBareMetalHostDiskDataViewRows}
          getObjectMetadata={getObjectMetadata}
          hideLabelFilter
        />
      </PaneBody>
    </div>
  );
};

export default BareMetalHostDisks;
