import * as React from 'react';
import { V1GPU, V1HostDevice } from '../../../types/api';
import HardwareDevicesListRow from './HardwareDevicesListRow';

export type HardwareDevicesListProps = {
  devices: V1GPU[] | V1HostDevice[];
  onDetachHandler?: (string) => void;
};

const HardwareDevicesList: React.FC<HardwareDevicesListProps> = ({ devices, onDetachHandler }) => (
  <>
    {devices?.map((device) => (
      <HardwareDevicesListRow
        isDisabled
        deviceName={device?.deviceName}
        name={device?.name}
        onDetachHandler={onDetachHandler}
      />
    ))}
  </>
);

export default HardwareDevicesList;
