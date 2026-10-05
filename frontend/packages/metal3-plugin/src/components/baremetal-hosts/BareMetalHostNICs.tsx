import type { FC } from 'react';
import { useMemo } from 'react';
import {
  RhMicronsCheckboxCompleteIcon,
  RhMicronsCheckboxIncompleteIcon,
} from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
  ResourceMetadata,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { getHostNICs } from '../../selectors/baremetal-hosts';
import type { BareMetalHostNIC, BareMetalHostKind } from '../../types/host';

const useBareMetalHostNICColumns = (): {
  columns: ConsoleDataViewColumn<BareMetalHostNIC>[];
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
        id: 'model',
        title: t('Model'),
        sort: 'model',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'pxe',
        title: t('PXE'),
        sort: 'pxe',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'ip',
        title: t('IP'),
        sort: 'ip',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'speed',
        title: t('Speed'),
        sort: 'speedGbps',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'mac',
        title: t('MAC Address'),
        sort: 'mac',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'vlanId',
        title: t('VLAN ID'),
        sort: 'vlanId',
        props: { modifier: 'nowrap' as const },
      },
    ],
    [t],
  );
  return { columns };
};

export const getBareMetalHostNICDataViewRows: GetDataViewRows<BareMetalHostNIC> = (data, columns) =>
  data.map(({ obj: { ip, mac, model, name, pxe, speedGbps, vlanId } }) => {
    const rowCells = {
      name: { cell: name },
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
  const { columns } = useBareMetalHostNICColumns();
  const nics = getHostNICs(host);
  return (
    <div className="co-m-list">
      <PaneBody>
        <ConsoleDataView<BareMetalHostNIC>
          id="console.ui~v1~BareMetalHostNICTable"
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
          hideLabelFilter
        />
      </PaneBody>
    </div>
  );
};

export default BareMetalHostNICs;
