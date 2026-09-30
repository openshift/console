import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ConsoleDataView,
  getNameCellProps,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { useColumnWidthSettings } from '@console/app/src/components/data-view/useResizableColumnProps';
import type { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
  ResourceMetadata,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { humanizeDecimalBytes } from '@console/internal/components/utils/units';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { getHostStorage } from '../../selectors/baremetal-hosts';
import type { BareMetalHostDisk, BareMetalHostKind } from '../../types/host';

/** Console-only model for column width preferences; not a cluster API resource. */
const BareMetalHostDiskTableModel: K8sModel = {
  apiGroup: 'console.ui',
  apiVersion: 'v1',
  kind: 'BareMetalHostDiskTable',
  id: 'baremetalhostdisktable',
  plural: 'baremetalhostdisktables',
  label: 'Disk',
  labelPlural: 'Disks',
  abbr: 'D',
};

const useBareMetalHostDiskColumns = (): {
  columns: ConsoleDataViewColumn<BareMetalHostDisk>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('metal3-plugin');
  const { getResizableProps, resetAllColumnWidths } = useColumnWidthSettings(
    BareMetalHostDiskTableModel,
  );
  const columns = useMemo(
    () => [
      {
        id: 'name',
        resizableProps: getResizableProps('name'),
        title: t('Name'),
        sort: 'name',
        props: { ...getNameColumnProps(), modifier: 'nowrap' as const },
      },
      {
        id: 'size',
        resizableProps: getResizableProps('size'),
        title: t('Size'),
        sort: 'sizeBytes',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'type',
        resizableProps: getResizableProps('type'),
        title: t('Type'),
        sort: 'rotational',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'model',
        resizableProps: getResizableProps('model'),
        title: t('Model'),
        sort: 'model',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'serialNumber',
        resizableProps: getResizableProps('serialNumber'),
        title: t('Serial Number'),
        sort: 'serialNumber',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'vendor',
        resizableProps: getResizableProps('vendor'),
        title: t('Vendor'),
        sort: 'vendor',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'hctl',
        resizableProps: getResizableProps('hctl'),
        title: t('HCTL'),
        sort: 'hctl',
        props: { modifier: 'nowrap' as const },
      },
    ],
    [t, getResizableProps],
  );
  return { columns, resetAllColumnWidths };
};

export const getBareMetalHostDiskDataViewRows: GetDataViewRows<BareMetalHostDisk> = (
  data,
  columns,
) =>
  data.map(({ obj: { hctl, model, name, rotational, serialNumber, sizeBytes, vendor } }) => {
    const rowCells = {
      name: { cell: name, props: getNameCellProps(name) },
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
  const { columns, resetAllColumnWidths } = useBareMetalHostDiskColumns();
  const disks = getHostStorage(host);
  return (
    <div className="co-m-list">
      <PaneBody>
        <ConsoleDataView<BareMetalHostDisk>
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
          hideColumnManagement
          hideLabelFilter
          isResizable
          resetAllColumnWidths={resetAllColumnWidths}
        />
      </PaneBody>
    </div>
  );
};

export default BareMetalHostDisks;
