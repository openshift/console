import type { FC } from 'react';
import {
  RhMicronsCheckboxCompleteIcon,
  RhMicronsCheckboxIncompleteIcon,
} from '@patternfly/react-icons';
import { sortable } from '@patternfly/react-table';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { RowFunctionArgs } from '@console/internal/components/factory';
import { Table, TableData } from '@console/internal/components/factory';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { getHostNICs } from '../../selectors/baremetal-hosts';
import type { BareMetalHostNIC, BareMetalHostKind } from '../../types/host';

const NICsTableHeader = (t: TFunction) => () => [
  { title: t('Name'), sortField: 'name', transforms: [sortable] },
  { title: t('Model'), sortField: 'model', transforms: [sortable] },
  { title: t('PXE'), sortField: 'pxe', transforms: [sortable] },
  { title: t('IP'), sortField: 'ip', transforms: [sortable] },
  { title: t('Speed'), sortField: 'speedGbps', transforms: [sortable] },
  { title: t('MAC Address'), sortField: 'mac', transforms: [sortable] },
  { title: t('VLAN ID'), sortField: 'vlanId', transforms: [sortable] },
];

const getRowProps = (obj) => ({
  id: obj.ip,
});

const NICsTableRow: FC<RowFunctionArgs<BareMetalHostNIC>> = ({ obj: nic }) => {
  const { ip, mac, model, name, pxe, speedGbps, vlanId } = nic;
  return (
    <>
      <TableData>{name}</TableData>
      <TableData>{model}</TableData>
      <TableData>
        {pxe ? <RhMicronsCheckboxCompleteIcon /> : <RhMicronsCheckboxIncompleteIcon />}
      </TableData>
      <TableData>{ip}</TableData>
      <TableData>{speedGbps} Gbps</TableData>
      <TableData>{mac}</TableData>
      <TableData>{vlanId}</TableData>
    </>
  );
};

type BareMetalHostNICsProps = {
  obj: BareMetalHostKind;
  loaded: boolean;
  loadError?: any;
};

const BareMetalHostNICs: FC<BareMetalHostNICsProps> = ({ obj: host, loadError, loaded }) => {
  const { t } = useTranslation('metal3-plugin');
  const nics = getHostNICs(host);
  return (
    <div className="co-m-list">
      <PaneBody>
        <Table
          data={nics}
          aria-label={t('Bare Metal Host NICs')}
          Header={NICsTableHeader(t)}
          Row={NICsTableRow}
          loaded={loaded}
          loadError={
            loadError ||
            (loaded && !host ? { message: t('Bare metal host is not available') } : undefined)
          }
          getRowProps={getRowProps}
        />
      </PaneBody>
    </div>
  );
};

export default BareMetalHostNICs;
