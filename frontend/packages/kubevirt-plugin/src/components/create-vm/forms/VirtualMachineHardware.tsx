import * as React from 'react';
import { Button, ButtonVariant, Popover, PopoverPosition } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import './create-vm-form.scss';

type VirtualMachineHardwareProps = {
  devicesNames: string[];
  title?: React.ReactNode;
};

const VirtualMachineHardware: React.FC<VirtualMachineHardwareProps> = ({
  devicesNames,
  title = 'Devices',
}) => {
  const { t } = useTranslation();
  if (!devicesNames) {
    return t('kubevirt-plugin~None');
  }

  const isMoreThenOneHW = devicesNames?.length > 1;
  const moreDevices = (
    <Popover
      headerContent={<div>{title}</div>}
      bodyContent={
        Array.isArray(devicesNames) && devicesNames?.map((device) => <div>{device}</div>)
      }
      hasAutoWidth
      position={PopoverPosition.top}
    >
      <Button className="kv-vm-hardware-devices--more-button" variant={ButtonVariant.link}>
        {t('kubevirt-plugin~+{{numberOfDevices}} more', {
          numberOfDevices: devicesNames.length - 1,
        })}
      </Button>
    </Popover>
  );
  return (
    <div>
      <div>{devicesNames?.[0]}</div>
      {isMoreThenOneHW && moreDevices}
    </div>
  );
};

export default VirtualMachineHardware;
