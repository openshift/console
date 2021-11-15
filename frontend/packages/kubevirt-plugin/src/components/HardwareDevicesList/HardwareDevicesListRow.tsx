import * as React from 'react';
import { Button, GridItem, TextInput } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';

export type HardwareDevicesListRowProps = {
  name?: string;
  deviceName?: string;
  onDetachHandler?: (id?: any) => void;
  isDisabled?: boolean;
};

export const HardwareDevicesListRow: React.FC<HardwareDevicesListRowProps> = ({
  name,
  deviceName,
  onDetachHandler,
  isDisabled,
}) => {
  return (
    <>
      <GridItem className="kv-hardware__row kv-hardware__name" span={5}>
        <TextInput value={name} isReadOnly />
      </GridItem>
      <GridItem className="kv-hardware__row kv-hardware__device" span={5}>
        <TextInput isReadOnly value={deviceName} />
      </GridItem>
      {!isDisabled && (
        <GridItem className="kv-hardware__row kv-hardware__remove-button" span={1}>
          <Button onClick={onDetachHandler} variant="link">
            <MinusCircleIcon />
          </Button>
        </GridItem>
      )}
    </>
  );
};
