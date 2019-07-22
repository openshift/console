import * as React from 'react';
import { TableData, TableRow } from '@console/internal/components/factory';
import { asAccessReview, Kebab, KebabOption } from '@console/internal/components/utils';
import { getDeletetionTimestamp, DASH } from '@console/shared';
import { TemplateModel } from '@console/internal/models';
import { BUS_VIRTIO } from '../../constants/vm';
import { deleteDeviceModal, DeviceType } from '../modals/delete-device-modal';
import { VMLikeEntityKind } from '../../types';
import { VirtualMachineModel } from '../../models';
import { isVM } from '../../selectors/selectors';
import { dimensifyRow } from '../../utils/table';
import { nicTableColumnClasses } from './utils';
import { VMNicRowProps } from './types';

const menuActionDelete = (vmLikeEntity: VMLikeEntityKind, nic): KebabOption => ({
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

const getActions = (vmLikeEntity: VMLikeEntityKind, nic) => {
  const actions = [menuActionDelete];
  return actions.map((a) => a(vmLikeEntity, nic));
};

export const NicRow: React.FC<VMNicRowProps> = ({
  obj: { networkName, binding, nic },
  customData: { vmLikeEntity },
  index,
  style,
}) => {
  const nicName = nic.name;
  const dimensify = dimensifyRow(nicTableColumnClasses);

  return (
    <TableRow id={nicName} index={index} trKey={nicName} style={style}>
      <TableData className={dimensify()}>{nicName}</TableData>
      <TableData className={dimensify()}>{nic.model || BUS_VIRTIO}</TableData>
      <TableData className={dimensify()}>{networkName}</TableData>
      <TableData className={dimensify()}>{binding || DASH}</TableData>
      <TableData className={dimensify()}>{nic.macAddress || DASH}</TableData>
      <TableData className={dimensify(true)}>
        <Kebab
          options={getActions(vmLikeEntity, nic)}
          key={`kebab-for--${nicName}`}
          isDisabled={getDeletetionTimestamp(vmLikeEntity)}
          id={`kebab-for-${nicName}`}
        />
      </TableData>
    </TableRow>
  );
};
