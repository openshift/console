import * as React from 'react';
import { Button, Text, TextVariants } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';

export const AddDeviceButton: React.FC<AddDeviceButtonType> = ({
  id,
  message,
  disabledMessage,
  isDisabled,
  onClick,
}) =>
  isDisabled ? (
    <Text component={TextVariants.p}>{disabledMessage}</Text>
  ) : (
    <Button
      className="pf-m-link--align-left"
      id={id}
      variant="link"
      onClick={onClick}
      icon={<PlusCircleIcon />}
    >
      {message}
    </Button>
  );

export type AddDeviceButtonType = {
  id: string;
  message: string;
  disabledMessage: string;
  isDisabled: boolean;
  onClick: () => void;
};
