import * as React from 'react';
import { V1GPU, V1HostDevice } from '../../types/api';
import { HardwareDevicesListRow, HardwareDevicesListRowProps } from './HardwareDevicesListRow';

export type HardwareDevicesListProps = {
  devices: V1GPU[] | V1HostDevice[];
  onDetachHandler?: (id?: any) => void;
  onCancelAttachHandler?: () => void;
} & HardwareDevicesListRowProps;

const HardwareDevicesList: React.FC<HardwareDevicesListProps> = ({
  devices,
  onDetachHandler,
  onCancelAttachHandler,
  isAttachDevice,
  isNameEmpty,
  isNameUsed,
  textProps,
  selectProps,
  isBlur,
}) => (
  <>
    {devices?.map((device) => (
      <HardwareDevicesListRow
        textProps={{ isReadOnly: true }}
        deviceName={device?.deviceName}
        name={device?.name}
        onClick={() => onDetachHandler(device?.name)}
      />
    ))}
    {isAttachDevice && (
      <HardwareDevicesListRow
        isBlur={isBlur}
        isNameUsed={isNameUsed}
        isNameEmpty={isNameEmpty}
        isAttachDevice={isAttachDevice}
        onClick={onCancelAttachHandler}
        textProps={{ ...textProps, isReadOnly: false }}
        selectProps={{ ...selectProps }}
      />
    )}
  </>
);

export default HardwareDevicesList;
