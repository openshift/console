import * as React from 'react';
import { Button, GridItem, TextInput } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';

export type HardwareDevicesListRowProps = {
  name?: string;
  deviceName?: string;
  onDetachHandler?: (id?: any) => void;
  isUserForbidden?: boolean;
};

export const HardwareDevicesListRow: React.FC<HardwareDevicesListRowProps> = ({
  name,
  deviceName,
  onDetachHandler,
  isUserForbidden,
}) => {
  return (
    <>
      <GridItem span={5}>
        <TextInput className="kv-label__key" value={name} isReadOnly />
      </GridItem>
      <GridItem span={6}>
        <TextInput className="kv-label__value" isReadOnly value={deviceName} />
      </GridItem>
      {!isUserForbidden && (
        <GridItem span={1}>
          <Button onClick={onDetachHandler} variant="link">
            <MinusCircleIcon />
          </Button>
        </GridItem>
      )}
    </>
  );
};
