import * as React from 'react';
import { OutlinedCheckSquareIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-check-square-icon';
import { OutlinedSquareIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-square-icon';
import { sortable } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Table, TableData, RowFunctionArgs } from '@console/internal/components/factory';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { getHostNICs } from '../../selectors';
import { BareMetalHostNIC, BareMetalHostKind } from '../../types';

const NICsTableHeader = (t: TFunction) => () => [
  { title: t('metal3-plugin~Name'), sortField: 'name', transforms: [sortable] },
  { title: t('metal3-plugin~Model'), sortField: 'model', transforms: [sortable] },
  { title: t('metal3-plugin~PXE'), sortField: 'pxe', transforms: [sortable] },
  { title: t('metal3-plugin~IP'), sortField: 'ip', transforms: [sortable] },
  { title: t('metal3-plugin~Speed'), sortField: 'speedGbps', transforms: [sortable] },
  { title: t('metal3-plugin~MAC Address'), sortField: 'mac', transforms: [sortable] },
  { title: t('metal3-plugin~VLAN ID'), sortField: 'vlanId', transforms: [sortable] },
];

const getRowProps = (obj) => ({
  id: obj.ip,
});

const NICsTableRow: React.FC<RowFunctionArgs<BareMetalHostNIC>> = ({ obj: nic }) => {
  const { ip, mac, model, name, pxe, speedGbps, vlanId } = nic;
  return (
    <>
      <TableData>{name}</TableData>
      <TableData>{model}</TableData>
      <TableData>{pxe ? <OutlinedCheckSquareIcon /> : <OutlinedSquareIcon />}</TableData>
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

const BareMetalHostNICs: React.FC<BareMetalHostNICsProps> = ({ obj: host, loadError, loaded }) => {
  const { t } = useTranslation();
  const nics = getHostNICs(host);
  return (
    <div className="co-m-list">
      <PaneBody>
        <Table
          data={nics}
          aria-label={t('metal3-plugin~Bare Metal Host NICs')}
          Header={NICsTableHeader(t)}
          Row={NICsTableRow}
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

export default BareMetalHostNICs;
