import * as React from 'react';
import { BootableDeviceType } from '../types';

export const BootOrder: React.FC<BootOrderProps> = ({ bootableDevices }) => {
  const listItems = bootableDevices.map((dev) => (
    <li key={`${dev.type}-${dev.value.name}`}>{dev.value.name}</li>
  ));

  return <ol className="kubevirt-boot-order__list">{listItems}</ol>;
};

type BootOrderProps = {
  bootableDevices: BootableDeviceType[];
};
