import type { FC } from 'react';
import { useMemo } from 'react';
import {
  RhMicronsCheckboxCompleteIcon,
  RhMicronsCheckboxIncompleteIcon,
} from '@patternfly/react-icons';
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
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { getHostNICs } from '../../selectors/baremetal-hosts';
import type { BareMetalHostNIC, BareMetalHostKind } from '../../types/host';

/** Console-only model for column width preferences; not a cluster API resource. */
const BareMetalHostNICTableModel: K8sModel = {
  apiGroup: 'console.ui',
  apiVersion: 'v1',
  kind: 'BareMetalHostNICTable',
  id: 'baremetalhostnictable',
  plural: 'baremetalhostnictables',
  label: 'Network Interface',
  labelPlural: 'Network Interfaces',
  abbr: 'NIC',
};

const useBareMetalHostNICColumns = (): {
  columns: ConsoleDataViewColumn<BareMetalHostNIC>[];
  resetAllColumnWidths: () => void;
} => {
  const { t } = useTranslation('metal3-plugin');
  const { getResizableProps, resetAllColumnWidths } = useColumnWidthSettings(
    BareMetalHostNICTableModel,
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
        id: 'model',
        resizableProps: getResizableProps('model'),
        title: t('Model'),
        sort: 'model',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'pxe',
        resizableProps: getResizableProps('pxe'),
        title: t('PXE'),
        sort: 'pxe',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'ip',
        resizableProps: getResizableProps('ip'),
        title: t('IP'),
        sort: 'ip',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'speed',
        resizableProps: getResizableProps('speed'),
        title: t('Speed'),
        sort: 'speedGbps',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'mac',
        resizableProps: getResizableProps('mac'),
        title: t('MAC Address'),
        sort: 'mac',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'vlanId',
        resizableProps: getResizableProps('vlanId'),
        title: t('VLAN ID'),
        sort: 'vlanId',
        props: { modifier: 'nowrap' as const },
      },
    ],
    [t, getResizableProps],
  );
  return { columns, resetAllColumnWidths };
};

export const getBareMetalHostNICDataViewRows: GetDataViewRows<BareMetalHostNIC> = (data, columns) =>
  data.map(({ obj: { ip, mac, model, name, pxe, speedGbps, vlanId } }) => {
    const rowCells = {
      name: { cell: name, props: getNameCellProps(name) },
      model: { cell: model },
      pxe: {
        cell: pxe ? <RhMicronsCheckboxCompleteIcon /> : <RhMicronsCheckboxIncompleteIcon />,
      },
      ip: { cell: ip },
      // Interpolating unconditionally would print "undefined Gbps" for a NIC that does not
      // report a speed. Leave the cell empty instead, as the other unset fields here do.
      speed: { cell: speedGbps == null ? '' : `${speedGbps} Gbps` },
      mac: { cell: mac },
      vlanId: { cell: vlanId },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });

const getObjectMetadata = (nic: BareMetalHostNIC): ResourceMetadata => ({ name: nic.name });

type BareMetalHostNICsProps = {
  obj: BareMetalHostKind;
  loaded: boolean;
  loadError?: any;
};

const BareMetalHostNICs: FC<BareMetalHostNICsProps> = ({ obj: host, loadError, loaded }) => {
  const { t } = useTranslation('metal3-plugin');
  const { columns, resetAllColumnWidths } = useBareMetalHostNICColumns();
  const nics = getHostNICs(host);
  return (
    <div className="co-m-list">
      <PaneBody>
        <ConsoleDataView<BareMetalHostNIC>
          label={t('Network Interfaces')}
          data={nics}
          loaded={loaded}
          loadError={
            loadError ||
            (loaded && !host ? { message: t('Bare metal host is not available') } : undefined)
          }
          columns={columns}
          getDataViewRows={getBareMetalHostNICDataViewRows}
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

export default BareMetalHostNICs;
