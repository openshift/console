import * as React from 'react';
import { TableData, TableRow } from '@console/internal/components/factory';
import { asAccessReview, Kebab, KebabOption } from '@console/internal/components/utils';
import { DASH, getDeletetionTimestamp } from '@console/shared/src';
import { TemplateModel } from '@console/internal/models';
import { deleteDeviceModal, DeviceType } from '../modals/delete-device-modal';
import { VirtualMachineModel } from '../../models';
import { isVM } from '../../selectors/vm';
import { dimensifyRow } from '../../utils/table';
import { VMLikeEntityKind } from '../../types';
import { nicModalEnhanced } from '../modals/nic-modal/nic-modal-enhanced';
import { nicTableColumnClasses } from './utils';
import { VMNicRowProps } from './types';

const menuActionEdit = (nic, network, vmLikeEntity: VMLikeEntityKind): KebabOption => ({
  label: 'Edit',
  callback: () =>
    nicModalEnhanced({
      vmLikeEntity,
      nic,
      network,
    }),
  accessReview: asAccessReview(
    isVM(vmLikeEntity) ? VirtualMachineModel : TemplateModel,
    vmLikeEntity,
    'patch',
  ),
});

const menuActionDelete = (nic, network, vmLikeEntity: VMLikeEntityKind): KebabOption => ({
  label: 'Delete',
  callback: () =>
    deleteDeviceModal({
      deviceType: DeviceType.NIC,
      device: nic,
      vmLikeEntity,
    }),
  accessReview: asAccessReview(
    isVM(vmLikeEntity) ? VirtualMachineModel : TemplateModel,
    vmLikeEntity,
    'patch',
  ),
});

const getActions = (nic, network, vmLikeEntity: VMLikeEntityKind) => {
  const actions = [menuActionEdit, menuActionDelete];
  return actions.map((a) => a(nic, network, vmLikeEntity));
};

export const NicRow: React.FC<VMNicRowProps> = ({
  obj: { name, model, networkName, interfaceType, macAddress, nic, network },
  customData: { vmLikeEntity },
  index,
  style,
}) => {
  const dimensify = dimensifyRow(nicTableColumnClasses);

  return (
    <TableRow id={name} index={index} trKey={name} style={style}>
      <TableData className={dimensify()}>{name}</TableData>
      <TableData className={dimensify()}>{model || DASH}</TableData>
      <TableData className={dimensify()}>{networkName || DASH}</TableData>
      <TableData className={dimensify()}>{interfaceType || DASH}</TableData>
      <TableData className={dimensify()}>{macAddress || DASH}</TableData>
      <TableData className={dimensify(true)}>
        <Kebab
          options={getActions(nic, network, vmLikeEntity)}
          key={`kebab-for--${name}`}
          isDisabled={getDeletetionTimestamp(vmLikeEntity)}
          id={`kebab-for-${name}`}
        />
      </TableData>
    </TableRow>
  );
};
