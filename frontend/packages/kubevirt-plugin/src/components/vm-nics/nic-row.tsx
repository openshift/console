import * as React from 'react';

import { VirtualTableData, VirtualTableRow } from '@console/internal/components/factory';
import { asAccessReview, Kebab, KebabOption } from '@console/internal/components/utils';
import { getDeletetionTimestamp, DASH } from '@console/shared';

import { TemplateModel } from '@console/internal/models';
import { BUS_VIRTIO } from '../../constants/vm';
import { deleteDeviceModal, DeviceType } from '../modals/delete-device-modal';
import { VMLikeEntityKind } from '../../types';
import { VMNicRowProps } from './types';
import { VirtualMachineModel } from '../../models';
import { isVm } from '../../selectors/selectors';
import { nicTableColumnClasses } from './utils';
import { dimensifyRow } from '../../utils/table';

const menuActionDelete = (vmLikeEntity: VMLikeEntityKind, nic): KebabOption => ({
  label: 'Delete',
  callback: () =>
    deleteDeviceModal({
      deviceType: DeviceType.NIC,
      device: nic,
      vmLikeEntity,
    }),
  accessReview: asAccessReview(
    isVm(vmLikeEntity) ? VirtualMachineModel : TemplateModel,
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
    <VirtualTableRow id={nicName} index={index} trKey={nicName} style={style}>
      <VirtualTableData className={dimensify()}>{nicName}</VirtualTableData>
      <VirtualTableData className={dimensify()}>{nic.model || BUS_VIRTIO}</VirtualTableData>
      <VirtualTableData className={dimensify()}>{networkName}</VirtualTableData>
      <VirtualTableData className={dimensify()}>{binding || DASH}</VirtualTableData>
      <VirtualTableData className={dimensify()}>{nic.macAddress || DASH}</VirtualTableData>
      <VirtualTableData className={dimensify(true)}>
        <Kebab
          options={getActions(vmLikeEntity, nic)}
          key={`kebab-for--${nicName}`}
          isDisabled={getDeletetionTimestamp(vmLikeEntity)}
          id={`kebab-for-${nicName}`}
        />
      </VirtualTableData>
    </VirtualTableRow>
  );
};
