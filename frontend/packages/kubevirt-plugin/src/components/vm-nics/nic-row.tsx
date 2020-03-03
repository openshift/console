import * as React from 'react';
import { TableData, TableRow } from '@console/internal/components/factory';
import { asAccessReview, Kebab, KebabOption } from '@console/internal/components/utils';
import { TemplateModel } from '@console/internal/models';
import { DASH, dimensifyRow, getDeletetionTimestamp } from '@console/shared';
import { deleteDeviceModal, DeviceType } from '../modals/delete-device-modal';
import { VirtualMachineModel } from '../../models';
import { asVM, isVM, isVMI, isVMRunning } from '../../selectors/vm';
import { VMLikeEntityKind } from '../../types/vmLike';
import { nicModalEnhanced } from '../modals/nic-modal/nic-modal-enhanced';
import { ValidationCell } from '../table/validation-cell';
import {
  VMNicRowActionOpts,
  NetworkBundle,
  NetworkSimpleData,
  NetworkSimpleDataValidation,
  VMNicRowCustomData,
} from './types';

const menuActionEdit = (
  nic,
  network,
  vmLikeEntity: VMLikeEntityKind,
  { withProgress }: VMNicRowActionOpts,
): KebabOption => ({
  label: 'Edit',
  callback: () =>
    withProgress(
      nicModalEnhanced({
        blocking: true,
        vmLikeEntity,
        nic,
        network,
      }).result,
    ),
  accessReview: asAccessReview(
    isVM(vmLikeEntity) ? VirtualMachineModel : TemplateModel,
    vmLikeEntity,
    'patch',
  ),
});

const menuActionDelete = (
  nic,
  network,
  vmLikeEntity: VMLikeEntityKind,
  { withProgress }: VMNicRowActionOpts,
): KebabOption => ({
  label: 'Delete',
  callback: () =>
    withProgress(
      deleteDeviceModal({
        deviceType: DeviceType.NIC,
        device: nic,
        vmLikeEntity,
      }).result,
    ),
  accessReview: asAccessReview(
    isVM(vmLikeEntity) ? VirtualMachineModel : TemplateModel,
    vmLikeEntity,
    'patch',
  ),
});

const getActions = (nic, network, vmLikeEntity: VMLikeEntityKind, opts: VMNicRowActionOpts) => {
  if (isVMI(vmLikeEntity) || isVMRunning(asVM(vmLikeEntity))) {
    return [];
  }
  const actions = [menuActionEdit, menuActionDelete];
  return actions.map((a) => a(nic, network, vmLikeEntity, opts));
};

export type VMNicSimpleRowProps = {
  data: NetworkSimpleData;
  validation?: NetworkSimpleDataValidation;
  columnClasses: string[];
  actionsComponent: React.ReactNode;
  index: number;
  style: object;
};

export const NicSimpleRow: React.FC<VMNicSimpleRowProps> = ({
  data: { name, model, networkName, interfaceType, macAddress },
  validation = {},
  columnClasses,
  actionsComponent,
  index,
  style,
}) => {
  const dimensify = dimensifyRow(columnClasses);

  return (
    <TableRow id={name} index={index} trKey={name} style={style}>
      <TableData className={dimensify()}>
        <ValidationCell validation={validation.name}>{name}</ValidationCell>
      </TableData>
      <TableData className={dimensify()}>
        <ValidationCell validation={validation.model}>{model || DASH}</ValidationCell>
      </TableData>
      <TableData className={dimensify()}>
        <ValidationCell validation={validation.network}>{networkName || DASH}</ValidationCell>
      </TableData>
      <TableData className={dimensify()}>
        <ValidationCell validation={validation.interfaceType}>
          {interfaceType || DASH}
        </ValidationCell>
      </TableData>
      <TableData className={dimensify()}>
        <ValidationCell validation={validation.macAddress}>{macAddress || DASH}</ValidationCell>
      </TableData>
      <TableData className={dimensify(true)}>{actionsComponent}</TableData>
    </TableRow>
  );
};

export type VMNicRowProps = {
  obj: NetworkBundle;
  customData: VMNicRowCustomData;
  index: number;
  style: object;
};

export const NicRow: React.FC<VMNicRowProps> = ({
  obj: { name, nic, network, ...restData },
  customData: { isDisabled, withProgress, vmLikeEntity, columnClasses },
  index,
  style,
}) => (
  <NicSimpleRow
    data={{ ...restData, name }}
    columnClasses={columnClasses}
    index={index}
    style={style}
    actionsComponent={
      <Kebab
        options={getActions(nic, network, vmLikeEntity, { withProgress })}
        isDisabled={
          isDisabled ||
          isVMI(vmLikeEntity) ||
          !!getDeletetionTimestamp(vmLikeEntity) ||
          isVMRunning(asVM(vmLikeEntity))
        }
        id={`kebab-for-${name}`}
      />
    }
  />
);
