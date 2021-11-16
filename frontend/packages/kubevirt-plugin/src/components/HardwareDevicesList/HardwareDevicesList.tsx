import * as React from 'react';
import { GridItem, Split, SplitItem, Text, TextVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import AddButton from '../AddButton/AddButton';
import { HardwareDevicesListRow, HardwareDevicesListRowProps } from './HardwareDevicesListRow';
import {
  HardwareDevicesListRowAddDevice,
  HardwareDevicesListRowAddDeviceProps,
} from './HardwareDevicesListRowAddDevice';

import './hardware-devices.scss';

export type HardwareDevice = {
  // Common denominator of V1GPU and V1HostDevice
  deviceName: string; // 'deviceName' is the resource name of the host device exposed by a device plugin
  name: string; // Name of the host device as exposed by a device plugin
};

export type HardwareDevicesListProps = {
  devices: HardwareDevice[];
  noDevicesFoundText?: string;
  addDeviceText?: string;
  onAttachHandler?: () => void;
  showAddDeviceRow?: boolean;
  emptyState?: React.ReactNode;
} & HardwareDevicesListRowProps &
  HardwareDevicesListRowAddDeviceProps;

const HardwareDevicesList: React.FC<HardwareDevicesListProps> = ({
  devices,
  onDetachHandler,
  onCancelAttachHandler,
  showAddDeviceRow,
  name,
  onNameChange,
  onValidateName,
  onResetValidateName,
  deviceName,
  emptyState = 'No devices found',
  addDeviceText,
  onAttachHandler,
  onDeviceNameChange,
  isDisabled,
}) => {
  const { t } = useTranslation();
  const showEmptyState = !(devices?.length > 0 || showAddDeviceRow);

  const headers = (
    <>
      <GridItem className="kv-hardware__name" span={5}>
        <Text component={TextVariants.h4}>{t('kubevirt-plugin~Name')}</Text>
      </GridItem>
      <GridItem className="kv-hardware__device" span={5}>
        <Text component={TextVariants.h4}>{t('kubevirt-plugin~Device name')}</Text>
      </GridItem>
    </>
  );

  const addButton = (
    <Split>
      <SplitItem>
        <AddButton
          isDisabled={showAddDeviceRow || isDisabled}
          onClick={onAttachHandler}
          btnText={addDeviceText}
        />
      </SplitItem>
    </Split>
  );

  return (
    <>
      {showEmptyState ? (
        emptyState
      ) : (
        <>
          {headers}
          {devices?.map((device) => (
            <HardwareDevicesListRow
              name={device?.name}
              deviceName={device?.deviceName}
              onDetachHandler={() => onDetachHandler(device?.name)}
              isDisabled={isDisabled}
            />
          ))}
          {showAddDeviceRow && (
            <HardwareDevicesListRowAddDevice
              onCancelAttachHandler={onCancelAttachHandler}
              name={name}
              onNameChange={onNameChange}
              onValidateName={onValidateName}
              onResetValidateName={onResetValidateName}
              deviceName={deviceName}
              onDeviceNameChange={onDeviceNameChange}
            />
          )}
        </>
      )}
      {addButton}
    </>
  );
};

export default HardwareDevicesList;
